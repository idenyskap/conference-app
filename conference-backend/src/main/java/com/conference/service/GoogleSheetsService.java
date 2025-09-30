package com.conference.service;

import com.conference.model.Participant;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.ServiceAccountCredentials;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.sheets.v4.Sheets;
import com.google.api.services.sheets.v4.SheetsScopes;
import com.google.api.services.sheets.v4.model.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class GoogleSheetsService {

    @Value("${google.sheets.spreadsheet-id}")
    private String spreadsheetId;

    @Value("${google.sheets.credentials-file:credentials.json}")
    private String credentialsFile;

    private static final String APPLICATION_NAME = "Conference Management System";
    private static final String RANGE = "Participants!A:F";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private Sheets sheetsService;


    private Sheets getSheetsService() throws IOException, GeneralSecurityException {
        if (sheetsService == null) {
            log.info("Initializing Google Sheets service");
            InputStream credentialsStream = getClass().getClassLoader()
                    .getResourceAsStream(credentialsFile);

            if (credentialsStream == null) {
                log.error("Credentials file not found: {}", credentialsFile);
                throw new IOException("Credentials file not found in resources folder: " + credentialsFile);
            }

            GoogleCredentials credentials = ServiceAccountCredentials
                    .fromStream(credentialsStream)
                    .createScoped(Collections.singleton(SheetsScopes.SPREADSHEETS));

            sheetsService = new Sheets.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName(APPLICATION_NAME)
                    .build();

            log.info("Google Sheets service initialized successfully");
        }
        return sheetsService;
    }

    public List<Participant> getAllParticipants() throws Exception {
        log.debug("Fetching all participants from spreadsheet: {}", spreadsheetId);
        Sheets service = getSheetsService();

        ValueRange response = service.spreadsheets().values()
                .get(spreadsheetId, RANGE)
                .execute();

        List<List<Object>> values = response.getValues();
        List<Participant> participants = new ArrayList<>();

        if (values == null || values.size() <= 1) {
            log.warn("No participant data found in spreadsheet");
            return participants;
        }

        for (int i = 1; i < values.size(); i++) {
            List<Object> row = values.get(i);
            try {
                Participant participant = Participant.builder()
                        .qrCode(row.size() > 0 ? row.get(0).toString() : "")
                        .name(row.size() > 1 ? row.get(1).toString() : "")
                        .surname(row.size() > 2 ? row.get(2).toString() : "")
                        .visited(row.size() > 3 && Boolean.parseBoolean(row.get(3).toString()))
                        .donation(row.size() > 4 ? parseDouble(row.get(4).toString()) : 0.0)
                        .updatedAt(row.size() > 5 ? row.get(5).toString() : "")
                        .build();

                participants.add(participant);
            } catch (Exception e) {
                log.warn("Error parsing row {}: {}", i, e.getMessage());
            }
        }

        log.debug("Retrieved {} participants", participants.size());
        return participants;
    }

    private double parseDouble(String value) {
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            log.warn("Invalid double value: {}", value);
            return 0.0;
        }
    }

    public boolean markAsPresent(String qrCode) throws Exception {
        log.debug("Marking participant as present: {}", qrCode);
        List<Participant> participants = getAllParticipants();

        for (int i = 0; i < participants.size(); i++) {
            Participant participant = participants.get(i);
            if (participant.getQrCode().equals(qrCode)) {
                if (participant.isVisited()) {
                    log.info("Participant {} is already checked in", qrCode);
                    return false;
                }

                String range = String.format("Participants!D%d:F%d", i + 2, i + 2);
                String timestamp = LocalDateTime.now().format(DATE_FORMATTER);

                List<List<Object>> values = Arrays.asList(
                        Arrays.asList("TRUE", participant.getDonation(), timestamp)
                );

                ValueRange body = new ValueRange().setValues(values);

                getSheetsService().spreadsheets().values()
                        .update(spreadsheetId, range, body)
                        .setValueInputOption("RAW")
                        .execute();

                log.info("Successfully marked participant {} as present", qrCode);
                return true;
            }
        }

        log.warn("Participant not found: {}", qrCode);
        return false;
    }

    public boolean addDonation(String qrCode, double amount) throws Exception {
        log.debug("Adding donation for participant {}: {}", qrCode, amount);
        List<Participant> participants = getAllParticipants();

        for (int i = 0; i < participants.size(); i++) {
            Participant participant = participants.get(i);
            if (participant.getQrCode().equals(qrCode)) {
                double newTotal = participant.getDonation() + amount;

                String range = String.format("Participants!E%d:F%d", i + 2, i + 2);
                String timestamp = LocalDateTime.now().format(DATE_FORMATTER);

                List<List<Object>> values = Arrays.asList(
                        Arrays.asList(newTotal, timestamp)
                );

                ValueRange body = new ValueRange().setValues(values);

                getSheetsService().spreadsheets().values()
                        .update(spreadsheetId, range, body)
                        .setValueInputOption("RAW")
                        .execute();

                log.info("Successfully added donation of {} for participant {}. New total: {}",
                        amount, qrCode, newTotal);
                return true;
            }
        }

        log.warn("Participant not found for donation: {}", qrCode);
        return false;
    }
}