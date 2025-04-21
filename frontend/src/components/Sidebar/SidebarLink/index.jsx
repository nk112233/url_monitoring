import React from "react";
import styles from "./SidebarLink.module.scss";
import { NavLink } from "react-router-dom";

const SidebarLink = ({ children, to, text }) => {
  return (
    <div className={styles.sidebarLink}>
      <NavLink
        to={to}
        className={({ isActive }) => isActive ? styles.active : undefined}
      >
        {children}
        {text}
      </NavLink>
    </div>
  );
};

export default SidebarLink;
