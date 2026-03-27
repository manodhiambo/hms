package com.helvinotech.hms.controller;

import com.helvinotech.hms.dto.ApiResponse;
import com.helvinotech.hms.dto.ExpenseDTO;
import com.helvinotech.hms.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseDTO>> create(
            @Valid @RequestBody ExpenseDTO dto,
            @RequestParam(required = false) Long recordedById) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.createExpense(dto, recordedById)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExpenseDTO>>> getAll(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getAll(pageable)));
    }

    @GetMapping("/range")
    public ResponseEntity<ApiResponse<Page<ExpenseDTO>>> getByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getByDateRange(start, end, pageable)));
    }

    @GetMapping("/total")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotal(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.getTotalByDateRange(start, end)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExpenseDTO>> update(
            @PathVariable Long id,
            @Valid @RequestBody ExpenseDTO dto) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.updateExpense(id, dto)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
