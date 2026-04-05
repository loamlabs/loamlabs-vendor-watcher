export default async function handler(req, res) {
    const { GITHUB_COMPONENTS_PAT, GITHUB_COMPONENTS_REPO, DASHBOARD_PASSWORD } = process.env;
    
    // Test writing to GitHub directly
    const testResult = {};
    
    if (!GITHUB_COMPONENTS_PAT || !GITHUB_COMPONENTS_REPO) {
        return res.status(200).json({
            error: 'Missing env vars',
            has_pat: !!GITHUB_COMPONENTS_PAT,
            has_repo: !!GITHUB_COMPONENTS_REPO,
            has_password: !!DASHBOARD_PASSWORD,
        });
    }
    
    // Test: can we read the rims.json file?
    const url = `https://api.github.com/repos/${GITHUB_COMPONENTS_REPO}/contents/component-data/rims.json`;
    try {
        const getResp = await fetch(url, {
            headers: { 'Authorization': `Bearer ${GITHUB_COMPONENTS_PAT}`, 'Accept': 'application/vnd.github.v3+json' }
        });
        const status = getResp.status;
        const body = await getResp.json();
        testResult.read_status = status;
        testResult.sha = body.sha;
        testResult.size = body.size;
        testResult.repo = GITHUB_COMPONENTS_REPO;
        testResult.pat_prefix = GITHUB_COMPONENTS_PAT.substring(0, 8) + '...';
        
        if (getResp.ok) {
            // Try a test write (just re-write the same content)
            const content = Buffer.from(body.content, 'base64').toString('utf-8');
            const data = JSON.parse(content);
            const reEncoded = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
            
            const putResp = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_COMPONENTS_PAT}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Dashboard Debug: Test write',
                    content: reEncoded,
                    sha: body.sha
                })
            });
            testResult.write_status = putResp.status;
            const writeBody = await putResp.json();
            testResult.write_response = putResp.ok ? 'SUCCESS' : writeBody;
        }
    } catch(e) {
        testResult.error = e.message;
    }
    
    return res.status(200).json(testResult);
}
