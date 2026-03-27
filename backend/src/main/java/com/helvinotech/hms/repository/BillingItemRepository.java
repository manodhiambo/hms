package com.helvinotech.hms.repository;

import com.helvinotech.hms.entity.BillingItem;
import com.helvinotech.hms.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillingItemRepository extends JpaRepository<BillingItem, Long> {
    List<BillingItem> findByBillingId(Long billingId);
    void deleteByBillingId(Long billingId);

    @Query("SELECT bi FROM BillingItem bi WHERE bi.serviceId = :serviceId AND bi.billing.status IN :statuses")
    List<BillingItem> findByServiceIdAndBillingStatusIn(@Param("serviceId") Long serviceId,
                                                         @Param("statuses") List<PaymentStatus> statuses);

    @Query("SELECT bi FROM BillingItem bi WHERE bi.drugId = :drugId AND bi.billing.status IN :statuses")
    List<BillingItem> findByDrugIdAndBillingStatusIn(@Param("drugId") Long drugId,
                                                      @Param("statuses") List<PaymentStatus> statuses);
}
