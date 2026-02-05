export type User = {
  oidcId: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  gender?: string;
  birthDay?: string;
  email?: string;
  phone?: string;
  picture?: string;
  password?: string;
  userDevices?: string[];

  address?: string;
  bio?: string;
  nationality?: string;
  socialFacebook?: string;
  socialLinkedin?: string;
  socialTwitter?: string;
  website?: string;

  isAgent?: boolean;
};
