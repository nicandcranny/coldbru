import React, { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { IconFolderPlus } from '@tabler/icons';
import get from 'lodash/get';
import Modal from 'components/Modal';
import Help from 'components/Help';
import { createWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { browseDirectory } from 'providers/ReduxStore/slices/collections/actions';
import { multiLineMsg } from 'utils/common/index';
import { formatIpcError } from 'utils/common/error';
import { sanitizeName, validateName, validateNameError } from 'utils/common/regex';

const CreateWorkspace = ({ onClose }) => {
  const inputRef = useRef(null);
  const dispatch = useDispatch();
  const workspaces = useSelector((state) => state.workspaces.workspaces);
  const preferences = useSelector((state) => state.app.preferences);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultLocation = get(preferences, 'general.defaultLocation', '');

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      workspaceName: '',
      workspaceLocation: defaultLocation
    },
    validationSchema: Yup.object({
      workspaceName: Yup.string()
        .trim()
        .min(1, 'Workspace title is required')
        .max(255, 'Must be 255 characters or less')
        .required('Workspace title is required')
        .test('unique-name', 'A workspace with this name already exists', function (value) {
          if (!value) return true;

          return !workspaces.some((workspace) =>
            workspace.name?.toLowerCase() === value.toLowerCase());
        }),
      workspaceLocation: Yup.string()
        .min(1, 'Folder location is required')
        .required('Folder location is required')
    }),
    onSubmit: async (values) => {
      if (isSubmitting) {
        return;
      }

      const workspaceName = values.workspaceName.trim();
      const workspaceFolderName = sanitizeName(workspaceName);

      if (!validateName(workspaceFolderName)) {
        toast.error(validateNameError(workspaceFolderName));
        return;
      }

      try {
        setIsSubmitting(true);
        await dispatch(createWorkspaceAction(workspaceName, workspaceFolderName, values.workspaceLocation));
        toast.success('Workspace created!');
        onClose();
      } catch (error) {
        toast.error(multiLineMsg('An error occurred while creating the workspace', formatIpcError(error)));
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const browse = () => {
    dispatch(browseDirectory())
      .then((dirPath) => {
        if (typeof dirPath === 'string' && dirPath.length > 0) {
          formik.setFieldValue('workspaceLocation', dirPath);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const canSubmit = !!formik.values.workspaceName.trim() && !!formik.values.workspaceLocation && !isSubmitting;
  const workspaceFolderName = sanitizeName(formik.values.workspaceName.trim());

  return (
    <Modal
      size="md"
      title="Create Workspace"
      confirmText={isSubmitting ? 'Creating...' : 'Create'}
      handleConfirm={formik.handleSubmit}
      handleCancel={onClose}
      confirmDisabled={!canSubmit}
    >
      <div className="flex flex-col">
        <form className="bruno-form" onSubmit={formik.handleSubmit}>
          <div className="mb-4">
            <label htmlFor="workspace-name" className="block font-semibold mb-2">
              Workspace Title
            </label>
            <input
              id="workspace-name"
              type="text"
              name="workspaceName"
              ref={inputRef}
              className="block textbox w-full"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.workspaceName}
            />
            {formik.touched.workspaceName && formik.errors.workspaceName ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceName}</div>
            ) : null}
          </div>

          <div className="mb-4">
            <label htmlFor="workspace-location" className="font-semibold mb-2 flex items-center">
              Folder Location
              <Help>
                <p>Choose the parent folder where Bruno should create the new workspace folder.</p>
              </Help>
            </label>

            <div
              className="border-2 border-dashed rounded-lg p-6 transition-colors duration-200 border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <IconFolderPlus size={28} className="text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-300 mb-2 break-all">
                  {formik.values.workspaceLocation || 'Choose a folder'}
                </p>
                <button
                  type="button"
                  className="text-blue-500 underline cursor-pointer"
                  onClick={browse}
                >
                  Browse
                </button>
              </div>
            </div>

            {formik.touched.workspaceLocation && formik.errors.workspaceLocation ? (
              <div className="text-red-500 text-sm mt-1">{formik.errors.workspaceLocation}</div>
            ) : null}

            {workspaceFolderName ? (
              <div className="text-xs text-muted mt-3">
                Workspace folder name: {workspaceFolderName}
              </div>
            ) : null}
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateWorkspace;
