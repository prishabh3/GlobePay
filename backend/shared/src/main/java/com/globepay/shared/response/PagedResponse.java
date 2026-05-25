package com.globepay.shared.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PagedResponse<T> {

    private List<T> content;
    private int pageNumber;
    private int pageSize;
    private long totalElements;
    private int totalPages;
    private boolean last;
    private boolean first;
    private int numberOfElements;
    private boolean empty;

    private PagedResponse() {}

    private PagedResponse(List<T> content, int pageNumber, int pageSize,
                          long totalElements, int totalPages,
                          boolean last, boolean first,
                          int numberOfElements, boolean empty) {
        this.content = content;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
        this.first = first;
        this.numberOfElements = numberOfElements;
        this.empty = empty;
    }

    public static <T> PagedResponse<T> of(Page<T> page) {
        return new PagedResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast(),
                page.isFirst(),
                page.getNumberOfElements(),
                page.isEmpty()
        );
    }

    public static <T, S> PagedResponse<T> of(Page<S> page, List<T> mappedContent) {
        return new PagedResponse<>(
                mappedContent,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast(),
                page.isFirst(),
                page.getNumberOfElements(),
                mappedContent.isEmpty()
        );
    }

    public static <T> PagedResponse<T> of(List<T> content) {
        return new PagedResponse<>(
                content,
                0,
                content.size(),
                content.size(),
                1,
                true,
                true,
                content.size(),
                content.isEmpty()
        );
    }
}
