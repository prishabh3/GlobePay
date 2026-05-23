package com.globepay.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Paged response envelope used for list/search endpoints across GlobePay services.
 *
 * @param <T> the type of individual items in the page
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PagedResponse<T> {

    /** The list of items on the current page. */
    private List<T> content;

    /** Current page number (0-indexed). */
    private int pageNumber;

    /** Number of items requested per page. */
    private int pageSize;

    /** Total number of elements across all pages. */
    private long totalElements;

    /** Total number of pages. */
    private int totalPages;

    /** Whether this is the last page. */
    private boolean last;

    /** Whether this is the first page. */
    private boolean first;

    /** Number of elements on the current page. */
    private int numberOfElements;

    /** Whether the result set is empty. */
    private boolean empty;

    // -----------------------------------------------------------------------
    // Factory helpers
    // -----------------------------------------------------------------------

    /**
     * Construct a {@link PagedResponse} directly from a Spring Data {@link Page}.
     */
    public static <T> PagedResponse<T> of(Page<T> page) {
        return PagedResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .numberOfElements(page.getNumberOfElements())
                .empty(page.isEmpty())
                .build();
    }

    /**
     * Construct a {@link PagedResponse} when the content list has been transformed
     * (e.g. entities mapped to DTOs) but paging metadata comes from the original page.
     */
    public static <T, S> PagedResponse<T> of(Page<S> page, List<T> mappedContent) {
        return PagedResponse.<T>builder()
                .content(mappedContent)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .numberOfElements(page.getNumberOfElements())
                .empty(mappedContent.isEmpty())
                .build();
    }

    /**
     * Wrap a plain list as a single-page response (useful when pagination is not needed
     * but callers expect the same envelope shape).
     */
    public static <T> PagedResponse<T> of(List<T> content) {
        return PagedResponse.<T>builder()
                .content(content)
                .pageNumber(0)
                .pageSize(content.size())
                .totalElements(content.size())
                .totalPages(1)
                .last(true)
                .first(true)
                .numberOfElements(content.size())
                .empty(content.isEmpty())
                .build();
    }
}
