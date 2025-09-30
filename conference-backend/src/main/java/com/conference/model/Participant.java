package com.conference.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Participant {
    private String qrCode;
    private String name;
    private String surname;
    private boolean visited;
    private double donation;
    private String updatedAt;
}
