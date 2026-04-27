import type {
  BeforeReviewJobHistoryItem,
  BridgeRunHistoryItem,
} from '@/types/scn001-history';

export interface VisibleScn001History {
  beforeJobs: BeforeReviewJobHistoryItem[];
  bridgeRuns: BridgeRunHistoryItem[];
}

export function filterVisibleScn001History(input: {
  beforeJobs: BeforeReviewJobHistoryItem[];
  bridgeRuns: BridgeRunHistoryItem[];
}): VisibleScn001History {
  const beforeStatusById = new Map(
    input.beforeJobs.map((job) => [job.before_review_job_id, job.status]),
  );

  return {
    beforeJobs: input.beforeJobs.filter(isBeforeReviewJobUserVisible),
    bridgeRuns: input.bridgeRuns.filter((bridgeRun) =>
      isBridgeRunUserVisible(bridgeRun, beforeStatusById),
    ),
  };
}

export function isBeforeReviewJobUserVisible(
  job: BeforeReviewJobHistoryItem,
): boolean {
  return job.status === 'completed';
}

function isBridgeRunUserVisible(
  bridgeRun: BridgeRunHistoryItem,
  beforeStatusById: Map<string, string>,
): boolean {
  if (!bridgeRun.before_review_job_id) {
    return true;
  }

  const sourceBeforeStatus = beforeStatusById.get(bridgeRun.before_review_job_id);
  if (sourceBeforeStatus === undefined) {
    return true;
  }

  return sourceBeforeStatus === 'completed';
}
