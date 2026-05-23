package com.globepay.shared.exception;

public class ValidationException extends BusinessException {
    public ValidationException(String message) {
        super(message, 400);
    }
}
