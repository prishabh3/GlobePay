package com.globepay.bank.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AccountVerificationResponse {
    private boolean verified;
    private String accountNumber;
    private String bankCode;
    private String accountHolderName;
    private String message;
}
