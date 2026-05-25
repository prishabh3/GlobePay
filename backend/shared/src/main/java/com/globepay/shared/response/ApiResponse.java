package com.globepay.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private int statusCode;

    private ApiResponse() {}

    private ApiResponse(boolean success, String message, T data, int statusCode) {
        this.success = success;
        this.message = message;
        this.data = data;
        this.timestamp = LocalDateTime.now();
        this.statusCode = statusCode;
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return new ApiResponse<>(true, message, data, 200);
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation completed successfully");
    }

    public static <T> ApiResponse<T> success(String message) {
        return new ApiResponse<>(true, message, null, 200);
    }

    public static <T> ApiResponse<T> error(String message, int statusCode) {
        return new ApiResponse<>(false, message, null, statusCode);
    }

    public static <T> ApiResponse<T> badRequest(String message) {
        return error(message, 400);
    }

    public static <T> ApiResponse<T> unauthorized(String message) {
        return error(message, 401);
    }

    public static <T> ApiResponse<T> forbidden(String message) {
        return error(message, 403);
    }

    public static <T> ApiResponse<T> notFound(String message) {
        return error(message, 404);
    }

    public static <T> ApiResponse<T> conflict(String message) {
        return error(message, 409);
    }

    public static <T> ApiResponse<T> internalError(String message) {
        return error(message, 500);
    }
}
