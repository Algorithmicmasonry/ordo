import React from "react";
import { DashboardHeader } from "../_components";

const AdminSettingsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <DashboardHeader heading="Settings" text="Manage your account settings" />
    </div>
  );
};

export default AdminSettingsPage;
