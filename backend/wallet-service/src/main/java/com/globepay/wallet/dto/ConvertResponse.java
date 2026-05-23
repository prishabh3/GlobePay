package com.globepay.wallet.dto;

import com.globepay.wallet.entity.Currency;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class ConvertResponse {
    private Currency fromCurrency;
    private Currency toCurrency;
    private BigDecimal originalAmount;
    private BigDecimal convertedAmount;
    private BigDecimal exchangeRate;
}
