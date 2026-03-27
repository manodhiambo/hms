package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.NursingNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NursingNoteRepository extends JpaRepository<NursingNote, Long> {
    List<NursingNote> findByAdmissionIdOrderByCreatedAtDesc(Long admissionId);

    // Delete nursing notes written by a specific nurse (used before hard-deleting a user)
    @Modifying
    @Query("DELETE FROM NursingNote n WHERE n.nurse.id = :userId")
    void deleteByNurseId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM NursingNote n WHERE n.admission.visit.id = :visitId")
    void deleteByAdmission_Visit_Id(@Param("visitId") Long visitId);
}
