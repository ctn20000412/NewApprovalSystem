package com.company.inventory.enums;

public enum ChangeType {
    IN("入库"),
    OUT("出库"),
    ADJUST("调整");
    
    private final String description;
    
    ChangeType(String description) {
        this.description = description;
    }
    
    public String getDescription() {
        return description;
    }
}
