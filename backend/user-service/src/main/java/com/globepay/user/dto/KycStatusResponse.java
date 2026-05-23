package com.globepay.user.dto;

import com.globepay.user.entity.KycStatus;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class KycStatusResponse {
    private String userId;
    private KycStatus overallStatus;
    private List<KycDocumentResponse> documents;
    private String message;
}
