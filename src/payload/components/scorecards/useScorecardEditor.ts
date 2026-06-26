import { toast } from '@payloadcms/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getErrorMessage } from '@/app/(app)/shared/lib/getErrorMessage';
import {
  GetTaxonomyScorecardResponse,
  TaxonomyScorecardVersion,
  TaxonomySearchItem,
  UpdateTaxonomyScorecardResponse,
} from '@/types/taxonomyScorecard';

import { enableScorecardVersion, fetchScorecard, saveScorecard } from './api';
import { ManagerError } from './types';
import { buildInitialWeights, sortVersions } from './utils';
import { useTenantSelection } from '@payloadcms/plugin-multi-tenant/client';
import {
  parseVersionId,
  validateScorecardWeights,
} from './scorecardEditorHelpers';

type UseScorecardEditorArgs = {
  selectedTaxonomy: TaxonomySearchItem;
};

export function useScorecardEditor({
  selectedTaxonomy,
}: UseScorecardEditorArgs) {
  const { selectedTenantID } = useTenantSelection();
  const tenantId = String(selectedTenantID);
  const [scorecardState, setScorecardState] = useState<{
    response: GetTaxonomyScorecardResponse | null;
    loading: boolean;
    error: ManagerError | null;
  }>({
    response: null,
    loading: false,
    error: null,
  });

  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [applyToChildren, setApplyToChildren] = useState(false);
  const [includeSiblings, setIncludeSiblings] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] =
    useState<UpdateTaxonomyScorecardResponse | null>(null);
  const [previewVersion, setPreviewVersion] =
    useState<TaxonomyScorecardVersion | null>(null);
  const [enablingVersionId, setEnablingVersionId] = useState<string | null>(
    null,
  );

  const loadCurrent = useCallback(async () => {
    if (!tenantId) {
      setScorecardState({ response: null, loading: false, error: null });
      setWeightInputs({});
      return;
    }

    setScorecardState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    try {
      const result = await fetchScorecard(tenantId, selectedTaxonomy.code);

      setScorecardState({ response: result, loading: false, error: null });
      setWeightInputs(buildInitialWeights(result.scorecard?.need?.weights));
    } catch (error) {
      setScorecardState({
        response: null,
        loading: false,
        error: { message: getErrorMessage(error) },
      });
      setWeightInputs({});
    }
  }, [selectedTaxonomy.code, tenantId]);

  useEffect(() => {
    setSaveResult(null);
    setValidationErrors({});
    setPreviewVersion(null);
    setIncludeSiblings(false);
    void loadCurrent();
  }, [loadCurrent]);

  const handleSave = async (draft: boolean) => {
    if (!tenantId) {
      return;
    }

    const { parsedWeights, errors } = validateScorecardWeights(weightInputs);
    setValidationErrors(errors);

    if (!parsedWeights) {
      toast.error('Please fix validation errors before saving.');
      return;
    }

    if (!draft && applyToChildren) {
      const accepted = window.confirm(
        `This will apply the same weights to this taxonomy and all child taxonomies whose HSIS code starts with ${selectedTaxonomy.code}.`,
      );

      if (!accepted) {
        return;
      }
    }

    setSaveLoading(true);
    setScorecardState((current) => ({ ...current, error: null }));

    try {
      const result = await saveScorecard(tenantId, selectedTaxonomy.code, {
        weights: parsedWeights,
        include_children: applyToChildren,
        include_siblings: includeSiblings,
        draft,
      });

      setSaveResult(result);
      toast.success(
        draft ? 'Draft saved successfully.' : 'Scorecard saved successfully.',
      );
      await loadCurrent();
    } catch (error) {
      const message = getErrorMessage(error);
      setScorecardState((current) => ({ ...current, error: { message } }));
      toast.error(message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEnable = async (versionId: string) => {
    if (!tenantId) {
      return;
    }

    const versionIdNumber = parseVersionId(versionId);
    if (versionIdNumber === null) {
      toast.error('Invalid version ID.');
      return;
    }

    setEnablingVersionId(versionId);
    setScorecardState((current) => ({ ...current, error: null }));

    try {
      await enableScorecardVersion(
        tenantId,
        selectedTaxonomy.code,
        versionIdNumber,
      );
      toast.success('Version enabled successfully.');
      await loadCurrent();
    } catch (error) {
      const message = getErrorMessage(error);
      setScorecardState((current) => ({ ...current, error: { message } }));
      toast.error(message);
    } finally {
      setEnablingVersionId(null);
    }
  };

  const versions = useMemo(
    () => sortVersions(scorecardState.response?.versions),
    [scorecardState.response?.versions],
  );

  return {
    scorecardState,
    weightInputs,
    validationErrors,
    applyToChildren,
    includeSiblings,
    saveLoading,
    saveResult,
    versions,
    previewVersion,
    enablingVersionId,
    setWeightInputs,
    setApplyToChildren,
    setIncludeSiblings,
    setPreviewVersion,
    handleSave,
    handleEnable,
  };
}
