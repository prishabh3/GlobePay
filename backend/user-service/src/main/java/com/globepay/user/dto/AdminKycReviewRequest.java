package com.globepay.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdminKycReviewRequest {

    @NotNull
    private Boolean approved;

    private String notes;
}
