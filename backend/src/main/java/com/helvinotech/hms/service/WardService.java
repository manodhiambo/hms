package com.helvinotech.hms.service;

import com.helvinotech.hms.dto.*;
import com.helvinotech.hms.entity.*;
import com.helvinotech.hms.enums.AdmissionStatus;
import com.helvinotech.hms.enums.BedStatus;
import com.helvinotech.hms.exception.BadRequestException;
import com.helvinotech.hms.exception.ResourceNotFoundException;
import com.helvinotech.hms.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WardService {

    private final WardRepository wardRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final AdmissionRepository admissionRepository;
    private final NursingNoteRepository nursingNoteRepository;
    private final PatientRepository patientRepository;
    private final VisitRepository visitRepository;
    private final UserRepository userRepository;

    // Ward CRUD
    @Transactional(readOnly = false)
    public WardDTO createWard(WardDTO dto) {
        Ward ward = Ward.builder().name(dto.getName()).type(dto.getType()).totalBeds(dto.getTotalBeds()).build();
        return mapWardToDto(wardRepository.save(ward));
    }

    public List<WardDTO> getAllWards() {
        return wardRepository.findByActiveTrue().stream().map(this::mapWardToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = false)
    public WardDTO updateWard(Long id, WardDTO dto) {
        Ward ward = wardRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Ward", id));
        ward.setName(dto.getName());
        ward.setType(dto.getType());
        ward.setTotalBeds(dto.getTotalBeds());
        return mapWardToDto(wardRepository.save(ward));
    }

    // Room CRUD
    @Transactional(readOnly = false)
    public RoomDTO createRoom(RoomDTO dto) {
        Ward ward = wardRepository.findById(dto.getWardId()).orElseThrow(() -> new ResourceNotFoundException("Ward", dto.getWardId()));
        Room room = Room.builder().roomNumber(dto.getRoomNumber()).ward(ward).type(dto.getType()).build();
        return mapRoomToDto(roomRepository.save(room));
    }

    public List<RoomDTO> getRoomsByWard(Long wardId) {
        return roomRepository.findByWardId(wardId).stream().map(this::mapRoomToDto).collect(Collectors.toList());
    }

    // Bed CRUD
    @Transactional(readOnly = false)
    public BedDTO createBed(BedDTO dto) {
        Room room = roomRepository.findById(dto.getRoomId()).orElseThrow(() -> new ResourceNotFoundException("Room", dto.getRoomId()));
        Bed bed = Bed.builder().bedNumber(dto.getBedNumber()).room(room).dailyCharge(dto.getDailyCharge()).build();
        return mapBedToDto(bedRepository.save(bed));
    }

    public List<BedDTO> getAvailableBeds() {
        return bedRepository.findByStatus(BedStatus.AVAILABLE).stream().map(this::mapBedToDto).collect(Collectors.toList());
    }

    // Admissions
    @Transactional(readOnly = false)
    public AdmissionDTO admitPatient(AdmissionDTO dto) {
        Patient patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient", dto.getPatientId()));
        Bed bed = bedRepository.findById(dto.getBedId())
                .orElseThrow(() -> new ResourceNotFoundException("Bed", dto.getBedId()));
        if (bed.getStatus() != BedStatus.AVAILABLE) throw new BadRequestException("Bed is not available");

        bed.setStatus(BedStatus.OCCUPIED);
        bedRepository.save(bed);

        Admission admission = Admission.builder()
                .patient(patient).bed(bed).admissionReason(dto.getAdmissionReason())
                .admittedAt(LocalDateTime.now()).build();
        if (dto.getVisitId() != null) {
            admission.setVisit(visitRepository.findById(dto.getVisitId()).orElse(null));
        }
        if (dto.getAdmittingDoctorId() != null) {
            admission.setAdmittingDoctor(userRepository.findById(dto.getAdmittingDoctorId()).orElse(null));
        }
        return mapAdmissionToDto(admissionRepository.save(admission));
    }

    @Transactional(readOnly = false)
    public AdmissionDTO dischargePatient(Long admissionId, String dischargeSummary) {
        Admission admission = admissionRepository.findById(admissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Admission", admissionId));
        admission.setStatus(AdmissionStatus.DISCHARGED);
        admission.setDischargeSummary(dischargeSummary);
        admission.setDischargedAt(LocalDateTime.now());
        Bed bed = admission.getBed();
        bed.setStatus(BedStatus.AVAILABLE);
        bedRepository.save(bed);
        return mapAdmissionToDto(admissionRepository.save(admission));
    }

    public Page<AdmissionDTO> getAdmissionsByStatus(AdmissionStatus status, Pageable pageable) {
        return admissionRepository.findByStatus(status, pageable).map(this::mapAdmissionToDto);
    }

    // Nursing Notes
    @Transactional(readOnly = false)
    public NursingNoteDTO addNursingNote(NursingNoteDTO dto) {
        Admission admission = admissionRepository.findById(dto.getAdmissionId())
                .orElseThrow(() -> new ResourceNotFoundException("Admission", dto.getAdmissionId()));
        User nurse = userRepository.findById(dto.getNurseId())
                .orElseThrow(() -> new ResourceNotFoundException("User", dto.getNurseId()));
        NursingNote note = NursingNote.builder()
                .admission(admission).nurse(nurse).notes(dto.getNotes()).vitalSigns(dto.getVitalSigns()).build();
        return mapNursingNoteToDto(nursingNoteRepository.save(note));
    }

    public List<NursingNoteDTO> getNursingNotes(Long admissionId) {
        return nursingNoteRepository.findByAdmissionIdOrderByCreatedAtDesc(admissionId)
                .stream().map(this::mapNursingNoteToDto).collect(Collectors.toList());
    }

    public long countAvailableBeds() { return bedRepository.countByStatus(BedStatus.AVAILABLE); }
    public long countOccupiedBeds() { return bedRepository.countByStatus(BedStatus.OCCUPIED); }
    public long countTotalBeds() { return bedRepository.count(); }

    private WardDTO mapWardToDto(Ward w) {
        WardDTO dto = new WardDTO();
        dto.setId(w.getId());
        dto.setName(w.getName());
        dto.setType(w.getType());
        dto.setTotalBeds(w.getTotalBeds());
        dto.setActive(w.isActive());
        return dto;
    }

    private RoomDTO mapRoomToDto(Room r) {
        RoomDTO dto = new RoomDTO();
        dto.setId(r.getId());
        dto.setRoomNumber(r.getRoomNumber());
        dto.setWardId(r.getWard().getId());
        dto.setWardName(r.getWard().getName());
        dto.setType(r.getType());
        dto.setBeds(r.getBeds().stream().map(this::mapBedToDto).collect(Collectors.toList()));
        return dto;
    }

    private BedDTO mapBedToDto(Bed b) {
        BedDTO dto = new BedDTO();
        dto.setId(b.getId());
        dto.setBedNumber(b.getBedNumber());
        dto.setRoomId(b.getRoom().getId());
        dto.setRoomNumber(b.getRoom().getRoomNumber());
        dto.setWardName(b.getRoom().getWard().getName());
        dto.setStatus(b.getStatus());
        dto.setDailyCharge(b.getDailyCharge());
        return dto;
    }

    private AdmissionDTO mapAdmissionToDto(Admission a) {
        AdmissionDTO dto = new AdmissionDTO();
        dto.setId(a.getId());
        dto.setPatientId(a.getPatient().getId());
        dto.setPatientName(a.getPatient().getFullName());
        dto.setPatientNo(a.getPatient().getPatientNo());
        if (a.getVisit() != null) dto.setVisitId(a.getVisit().getId());
        dto.setBedId(a.getBed().getId());
        dto.setBedNumber(a.getBed().getBedNumber());
        dto.setRoomNumber(a.getBed().getRoom().getRoomNumber());
        dto.setWardName(a.getBed().getRoom().getWard().getName());
        if (a.getAdmittingDoctor() != null) {
            dto.setAdmittingDoctorId(a.getAdmittingDoctor().getId());
            dto.setAdmittingDoctorName(a.getAdmittingDoctor().getFullName());
        }
        dto.setStatus(a.getStatus());
        dto.setAdmissionReason(a.getAdmissionReason());
        dto.setDischargeSummary(a.getDischargeSummary());
        dto.setAdmittedAt(a.getAdmittedAt());
        dto.setDischargedAt(a.getDischargedAt());
        dto.setCreatedAt(a.getCreatedAt());
        return dto;
    }

    private NursingNoteDTO mapNursingNoteToDto(NursingNote n) {
        NursingNoteDTO dto = new NursingNoteDTO();
        dto.setId(n.getId());
        dto.setAdmissionId(n.getAdmission().getId());
        dto.setNurseId(n.getNurse().getId());
        dto.setNurseName(n.getNurse().getFullName());
        dto.setNotes(n.getNotes());
        dto.setVitalSigns(n.getVitalSigns());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}
