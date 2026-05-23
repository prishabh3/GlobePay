package com.globepay.wallet.dto;

import com.globepay.wallet.entity.Currency;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateWalletRequest {

    @NotNull(message = "Currency is required")
    private Currency currency;
}
