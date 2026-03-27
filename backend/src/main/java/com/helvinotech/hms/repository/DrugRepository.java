package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.Drug;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DrugRepository extends JpaRepository<Drug, Long> {
    // Tenant-scoped
    Page<Drug> findByHospitalIdAndGenericNameContainingIgnoreCase(Long hospitalId, String name, Pageable pageable);
    List<Drug> findByHospitalIdAndQuantityInStockLessThanEqual(Long hospitalId, Integer threshold);
    List<Drug> findByHospitalIdAndExpiryDateBefore(Long hospitalId, LocalDate date);
    Page<Drug> findByHospitalIdAndActiveTrue(Long hospitalId, Pageable pageable);

    @Query("SELECT d FROM Drug d WHERE d.hospitalId = :hospitalId AND (LOWER(d.genericName) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(d.brandName) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<Drug> searchDrugs(@Param("hospitalId") Long hospitalId, @Param("q") String query, Pageable pageable);

    // Legacy
    Page<Drug> findByGenericNameContainingIgnoreCase(String name, Pageable pageable);
    List<Drug> findByQuantityInStockLessThanEqual(Integer threshold);
    List<Drug> findByExpiryDateBefore(LocalDate date);
    Page<Drug> findByActiveTrue(Pageable pageable);

    @Query("SELECT d FROM Drug d WHERE LOWER(d.genericName) LIKE LOWER(CONCAT('%', :q, '%')) " +
           "OR LOWER(d.brandName) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<Drug> searchDrugs(@Param("q") String query, Pageable pageable);
}
