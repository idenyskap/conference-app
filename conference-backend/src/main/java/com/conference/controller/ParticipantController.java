package com.conference.controller;

import com.conference.model.Participant;
import com.conference.service.GoogleSheetsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/participants")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ParticipantController {

    private final GoogleSheetsService googleSheetsService;

    @GetMapping
    public ResponseEntity<?> getAllParticipants() {
        try {
            log.info("Fetching all participants");
            List<Participant> participants = googleSheetsService.getAllParticipants();
            log.info("Successfully retrieved {} participants", participants.size());
            return ResponseEntity.ok(participants);
        } catch (Exception e) {
            log.error("Error fetching participants: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch participants: " + e.getMessage()));
        }
    }

    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(@RequestBody Map<String, String> request) {
        try {
            String qrCode = request.get("qrCode");

            if (qrCode == null || qrCode.isBlank()) {
                log.warn("Check-in attempt with empty QR code");
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "QR code is required"));
            }

            log.info("Processing check-in for QR code: {}", qrCode);
            boolean success = googleSheetsService.markAsPresent(qrCode);

            if (success) {
                log.info("Successfully checked in participant with QR code: {}", qrCode);
                return ResponseEntity.ok(Map.of("message", "Check-in successful"));
            } else {
                log.warn("Check-in failed for QR code: {} - Participant not found or already checked in", qrCode);
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Participant not found or already checked in"));
            }
        } catch (Exception e) {
            log.error("Error during check-in: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Check-in failed: " + e.getMessage()));
        }
    }

    @PostMapping("/donation")
    public ResponseEntity<?> addDonation(@RequestBody Map<String, Object> request) {
        try {
            String qrCode = (String) request.get("qrCode");
            Object amountObj = request.get("amount");

            if (qrCode == null || qrCode.isBlank()) {
                log.warn("Donation attempt with empty QR code");
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "QR code is required"));
            }

            if (amountObj == null) {
                log.warn("Donation attempt with missing amount");
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Donation amount is required"));
            }

            Double amount = Double.valueOf(amountObj.toString());

            if (amount <= 0) {
                log.warn("Donation attempt with invalid amount: {}", amount);
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Donation amount must be positive"));
            }

            log.info("Processing donation for QR code: {} - Amount: {}", qrCode, amount);
            boolean success = googleSheetsService.addDonation(qrCode, amount);

            if (success) {
                log.info("Successfully added donation for QR code: {} - Amount: {}", qrCode, amount);
                return ResponseEntity.ok(Map.of(
                        "message", "Donation added successfully",
                        "amount", amount
                ));
            } else {
                log.warn("Donation failed for QR code: {} - Participant not found", qrCode);
                return ResponseEntity
                        .badRequest()
                        .body(Map.of("error", "Participant not found"));
            }
        } catch (NumberFormatException e) {
            log.error("Invalid donation amount format: {}", e.getMessage());
            return ResponseEntity
                    .badRequest()
                    .body(Map.of("error", "Invalid donation amount format"));
        } catch (Exception e) {
            log.error("Error adding donation: {}", e.getMessage(), e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to add donation: " + e.getMessage()));
        }
    }
}