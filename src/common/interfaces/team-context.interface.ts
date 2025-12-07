export interface TeamContext {
  teamIds: string[];
  rolesByTeam: Record<string, string>; // teamId -> role
  isAdmin?: boolean;
}
