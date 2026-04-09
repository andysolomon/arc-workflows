import { Octokit } from '@octokit/rest';
import { auth } from '@/lib/auth';

interface SaveRequest {
  owner: string;
  repo: string;
  branch: string;
  path: string;
  content: string;
  message: string;
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const body = (await req.json()) as SaveRequest;
  const { owner, repo, branch, path, content, message } = body;

  const octokit = new Octokit({ auth: session.accessToken });

  // Check for existing file to grab its SHA
  let sha: string | undefined;
  try {
    const existing = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });
    if (!Array.isArray(existing.data) && 'sha' in existing.data) {
      sha = existing.data.sha;
    }
  } catch {
    // File doesn't exist — that's a normal create
  }

  const params: Parameters<typeof octokit.rest.repos.createOrUpdateFileContents>[0] = {
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString('base64'),
    branch,
  };
  if (sha !== undefined) params.sha = sha;
  await octokit.rest.repos.createOrUpdateFileContents(params);

  return Response.json({ success: true });
}
