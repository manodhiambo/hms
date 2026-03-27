package com.helvinotech.hms.dto;

import com.helvinotech.hms.enums.BedStatus;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class BedDTO {
    private Long id;
    private String bedNumber;
    private Long roomId;
    private String roomNumber;
    private String wardName;
    private BedStatus status;
    private BigDecimal dailyCharge;
}
