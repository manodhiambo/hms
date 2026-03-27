package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.ExpenseDTO;
import com.helvinotech.hms.entity.Expense;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.ExpenseRepository;
import com.helvinotech.hms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = false)
    public ExpenseDTO createExpense(ExpenseDTO dto, Long recordedById) {
        Expense expense = Expense.builder()
                .category(dto.getCategory())
                .description(dto.getDescription())
                .amount(dto.getAmount())
                .expenseDate(dto.getExpenseDate() != null ? dto.getExpenseDate() : LocalDate.now())
                .referenceNumber(dto.getReferenceNumber())
                .vendor(dto.getVendor())
                .build();
        if (recordedById != null) {
            userRepository.findById(recordedById).ifPresent(expense::setRecordedBy);
        }
        return mapToDto(expenseRepository.save(expense));
    }

    public Page<ExpenseDTO> getAll(Pageable pageable) {
        return expenseRepository.findAll(pageable).map(this::mapToDto);
    }

    public Page<ExpenseDTO> getByDateRange(LocalDate start, LocalDate end, Pageable pageable) {
        return expenseRepository.findByExpenseDateBetween(start, end, pageable).map(this::mapToDto);
    }

    public BigDecimal getTotalByDateRange(LocalDate start, LocalDate end) {
        return expenseRepository.sumExpensesByDateRange(start, end);
    }

    @Transactional(readOnly = false)
    public ExpenseDTO updateExpense(Long id, ExpenseDTO dto) {
        Expense expense = expenseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Expense", id));
        expense.setCategory(dto.getCategory());
        expense.setDescription(dto.getDescription());
        expense.setAmount(dto.getAmount());
        if (dto.getExpenseDate() != null) expense.setExpenseDate(dto.getExpenseDate());
        expense.setReferenceNumber(dto.getReferenceNumber());
        expense.setVendor(dto.getVendor());
        return mapToDto(expenseRepository.save(expense));
    }

    @Transactional(readOnly = false)
    public void deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Expense", id);
        }
        expenseRepository.deleteById(id);
    }

    private ExpenseDTO mapToDto(Expense e) {
        ExpenseDTO dto = new ExpenseDTO();
        dto.setId(e.getId());
        dto.setCategory(e.getCategory());
        dto.setDescription(e.getDescription());
        dto.setAmount(e.getAmount());
        dto.setExpenseDate(e.getExpenseDate());
        dto.setReferenceNumber(e.getReferenceNumber());
        dto.setVendor(e.getVendor());
        if (e.getRecordedBy() != null) dto.setRecordedByName(e.getRecordedBy().getFullName());
        dto.setCreatedAt(e.getCreatedAt());
        return dto;
    }
}
