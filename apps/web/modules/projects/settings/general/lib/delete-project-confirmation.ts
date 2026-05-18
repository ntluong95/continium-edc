export const validateConfirmationName = (input: string, workspaceName: string): boolean => {
  return input.trim().toLowerCase() === workspaceName.trim().toLowerCase();
};
