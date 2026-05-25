package com.globepay.user.controller;

import com.globepay.shared.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/kyc")
@Slf4j
public class FileUploadController {

    private final Path uploadDir;

    public FileUploadController(@Value("${kyc.upload-dir:/uploads/kyc}") String uploadDirPath) throws IOException {
        this.uploadDir = Paths.get(uploadDirPath);
        Files.createDirectories(this.uploadDir);
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("file") MultipartFile file) throws IOException {

        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }

        String filename = userId + "_" + UUID.randomUUID() + ext;
        Path dest = uploadDir.resolve(filename);
        file.transferTo(dest);

        String fileUrl = "/api/v1/kyc/files/" + filename;
        log.info("KYC file uploaded for user {}: {}", userId, filename);

        return ResponseEntity.ok(ApiResponse.success(Map.of("url", fileUrl), "File uploaded successfully"));
    }

    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) throws MalformedURLException {
        Path file = uploadDir.resolve(filename);
        Resource resource = new UrlResource(file.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = "application/octet-stream";
        try {
            contentType = Files.probeContentType(file);
            if (contentType == null) contentType = "application/octet-stream";
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
