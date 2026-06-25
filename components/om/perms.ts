"use client";

import type { User } from "@/lib/auth";
import type { Project } from "@/lib/om";

/** Whether the user can create/edit/delete (Super Admin only). */
export function canManage(user: User) {
  return user.role === "super_admin";
}

/** Whether the user can upload data/images (Admin + Field Engineer). */
export function canUpload(user: User) {
  return user.role === "super_admin" || user.role === "field_engineer";
}

/** Whether the user can access a given project (client scoping). */
export function canAccessProject(user: User, project: Project) {
  if (user.role !== "client") return true;
  if (user.clientSubRole === "client_viewer")
    return project.id === user.restrictedProjectId;
  return project.clientId === user.clientId;
}
