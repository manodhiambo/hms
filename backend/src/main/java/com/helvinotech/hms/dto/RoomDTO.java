package com.helvinotech.hms.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class RoomDTO {
    private Long id;
    @NotBlank
    private String roomNumber;
    @NotNull
    private Long wardId;
    private String wardName;
    private String type;
    private List<BedDTO> beds;
}
