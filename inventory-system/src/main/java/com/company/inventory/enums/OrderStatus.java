package com.company.inventory.enums;

public enum OrderStatus {
    PENDING("待确认"),
    CONFIRMED("已确认"),
    COMPLETED("已完成"),
    CANCELLED("已取消");
    
    private final String description;
    
    OrderStatus(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
