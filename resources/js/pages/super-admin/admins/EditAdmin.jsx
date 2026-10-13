import React from "react";

import CreateAdmin from "./CreateAdmin";

export default function EditAdmin({ adminId, navigateTo }) {
    return (
        <CreateAdmin
            mode="edit"
            adminId={adminId}
            onBack={() => navigateTo?.("/administrators")}
        />
    );
}
