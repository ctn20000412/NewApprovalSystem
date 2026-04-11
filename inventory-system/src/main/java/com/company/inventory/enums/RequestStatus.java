package com.company.inventory.enums;

public enum RequestStatus {
    PENDING("待审核"),
    APPROVED("已同意"),
    REJECTED("已拒绝"),
    ADJUSTED("已调整"),
    COMPLETED("已完成"),
    CANCELLED("已取消");
    
    private final String description;
    
    RequestStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
