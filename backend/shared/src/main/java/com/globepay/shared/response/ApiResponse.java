package com.globepay.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Standard API response envelope used across all GlobePay microservices.
 *
 * @param <T> the type of the data payload
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {

    private boolean success;
    private String message;
    private T data;
    private LocalDateTime timestamp;
    private int statusCode;

    // -----------------------------------------------------------------------
    // Factory helpers
    // -----------------------------------------------------------------------

    /**
     * 200 OK with payload and custom message.
     */
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .statusCode(200)
                .build();
    }

    /**
     * 200 OK with payload and default message.
     */
    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Operation completed successfully");
    }

    /**
     * 200 OK with no payload (e.g. delete confirmations).
     */
    public static <T> ApiResponse<T> success(String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .statusCode(200)
                .build();
    }

    /**
     * Generic error response with caller-supplied HTTP status code.
     */
    public static <T> ApiResponse<T> error(String message, int statusCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .statusCode(statusCode)
                .build();
    }

    /**
     * 400 Bad Request.
     */
    public static <T> ApiResponse<T> badRequest(String message) {
        return error(message, 400);
    }

    /**
     * 401 Unauthorized.
     */
    public static <T> ApiResponse<T> unauthorized(String message) {
        return error(message, 401);
    }

    /**
     * 403 Forbidden.
     */
    public static <T> ApiResponse<T> forbidden(String message) {
        return error(message, 403);
    }

    /**
     * 404 Not Found.
     */
    public static <T> ApiResponse<T> notFound(String message) {
        return error(message, 404);
    }

    /**
     * 409 Conflict.
     */
    public static <T> ApiResponse<T> conflict(String message) {
        return error(message, 409);
    }

    /**
     * 500 Internal Server Error.
     */
    public static <T> ApiResponse<T> internalError(String message) {
        return error(message, 500);
    }
}
