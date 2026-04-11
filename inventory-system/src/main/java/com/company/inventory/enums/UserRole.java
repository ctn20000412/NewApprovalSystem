package com.company.inventory.enums;

public enum UserRole {
    SALES("销售"),
    MANAGER("经理");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
