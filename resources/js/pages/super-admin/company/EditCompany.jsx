import React from "react";

import CreateCompany from "./CreateCompany";

import "./EditCompany.css";

const EditCompany = ({ companyId, navigateTo }) => {
    return (
        <CreateCompany
            mode="edit"
            companyId={companyId}
            navigateTo={navigateTo}
        />
    );
};

export default EditCompany;
