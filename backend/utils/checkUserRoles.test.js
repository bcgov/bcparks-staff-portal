import { describe, it, expect } from "vitest";
import checkUserRoles, { getRolesFromAuth } from "./checkUserRoles.js";
import { SUPER_ADMIN, DOOT_APPROVER, DOOT_CONTRIBUTOR } from "../constants/userRoles.js";

describe("checkUserRoles", () => {
  it("returns true when the user has one of the desired roles", () => {
    expect(checkUserRoles([DOOT_APPROVER], [DOOT_APPROVER, DOOT_CONTRIBUTOR])).toBe(
      true,
    );
  });

  it("returns false when the user has none of the desired roles", () => {
    expect(checkUserRoles([DOOT_CONTRIBUTOR], [DOOT_APPROVER])).toBe(false);
  });

  it("returns true for a super admin by default, even without a desired role", () => {
    expect(checkUserRoles([SUPER_ADMIN], [DOOT_APPROVER])).toBe(true);
  });

  it("ignores super admin status when orSuperAdmin is false", () => {
    expect(checkUserRoles([SUPER_ADMIN], [DOOT_APPROVER], false)).toBe(false);
  });
});

describe("getRolesFromAuth", () => {
  it("returns the roles array from the staff-portal resource access", () => {
    const userAuth = {
      resource_access: { // eslint-disable-line camelcase -- mirrors Keycloak's payload shape
        "staff-portal": { roles: [DOOT_APPROVER] },
      },
    };

    expect(getRolesFromAuth(userAuth)).toEqual([DOOT_APPROVER]);
  });
});
