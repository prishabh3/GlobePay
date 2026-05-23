package com.globepay.wallet.service;

import com.globepay.wallet.entity.Currency;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

/**
 * Simulated exchange rate service with static rates relative to USD.
 * In production this would call an external FX provider.
 */
@Service
public class ExchangeRateService {

    private static final Map<Currency, BigDecimal> RATES_TO_USD = Map.of(
            Currency.USD, BigDecimal.ONE,
            Currency.INR, new BigDecimal("0.012"),
            Currency.EUR, new BigDecimal("1.08"),
            Currency.GBP, new BigDecimal("1.27"),
            Currency.AED, new BigDecimal("0.272"),
            Currency.SGD, new BigDecimal("0.74"),
            Currency.CAD, new BigDecimal("0.74"),
            Currency.AUD, new BigDecimal("0.65")
    );

    public BigDecimal getRate(Currency from, Currency to) {
        BigDecimal fromUsd = RATES_TO_USD.get(from);
        BigDecimal toUsd = RATES_TO_USD.get(to);
        return toUsd.divide(fromUsd, 6, java.math.RoundingMode.HALF_UP);
    }

    public BigDecimal convert(BigDecimal amount, Currency from, Currency to) {
        return amount.multiply(getRate(from, to)).setScale(4, java.math.RoundingMode.HALF_UP);
    }
}
