package com.globepay.bank.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AccountVerificationRequest {
    @NotBlank private String accountNumber;
    @NotBlank private String bankCode;
    @NotBlank private String accountHolderName;
}
