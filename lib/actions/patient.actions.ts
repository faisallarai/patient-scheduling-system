'use server';

import { ID, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import {
  BUCKET_ID,
  DATABASE_ID,
  databases,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  storage,
  users,
} from '../appwrite.config';
import { parseStringify } from '../utils';

export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users
      .create(ID.unique(), user.email, user.phone, undefined, user.name)
      .catch(async (error) => {
        if (error && error?.code === 409) {
          const documents = await users.list([
            Query.equal('email', [user.email]),
          ]);

          return documents?.users[0];
        }
        console.error(
          'An error occurred while creating a new user:',
          error.message
        );
      });

    return parseStringify(newUser);
  } catch (error: any) {
    // check existing user
    if (error && error?.code === 409) {
      const documents = await users.list([Query.equal('email', [user.email])]);

      return documents?.users[0];
    }
    console.error(
      'An error occurred while creating a new user:',
      error.message
    );
  }
};

export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);
    return parseStringify(user);
  } catch (error: any) {
    console.log(error.message);
  }
};

export const isPhoneExist = async (phone: string) => {
  try {
    const userList = await users.list([Query.equal('phone', phone)]);
    return userList.total < 1;
  } catch (error: any) {
    console.log(error.message);
  }
};

export const isEmailExist = async (email: string) => {
  try {
    const userList = await users.list([Query.equal('email', email)]);
    return userList.total < 1;
  } catch (error: any) {
    console.log(error.message);
  }
};

export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file;

    console.log('BUCKET_ID', BUCKET_ID);

    if (identificationDocument) {
      const inputFile = InputFile.fromBuffer(
        identificationDocument?.get('blobFile') as Blob,
        identificationDocument?.get('fileName') as string
      );

      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
    }

    console.log({
      identificationDocumentId: file?.$id ? file.$id : null,
      identificationDocumentUrl: file?.$id
        ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view??project=${PROJECT_ID}`
        : null,
      ...patient,
    });

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id ? file.$id : null,
        identificationDocumentUrl: file?.$id
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view??project=${PROJECT_ID}`
          : null,
        ...patient,
      }
    );

    return parseStringify(newPatient);
  } catch (error: any) {
    console.log(error.message);
  }
};

export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal('userId', userId)]
    );

    return parseStringify(patients.documents[0]);
  } catch (error: any) {
    console.log(error.message);
  }
};
