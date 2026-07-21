import fs from 'node:fs';

const path = 'app/page.tsx';
let source = fs.readFileSync(path, 'utf8');

if (!source.includes('import { DigitalToolbox } from "@/components/digital-toolbox";')) {
  source = source.replace(
    'import { CloudAccount } from "@/components/cloud-workspace";',
    'import { CloudAccount } from "@/components/cloud-workspace";\nimport { DigitalToolbox } from "@/components/digital-toolbox";'
  );
}

if (!source.includes('href="#toolbox"')) {
  source = source.replace(
    '<a href="#team"><Users />AI workforce</a>',
    '<a href="#team"><Users />AI workforce</a>\n          <a href="#toolbox"><ClipboardCheck />Digital toolbox</a>'
  );
}

if (!source.includes('<DigitalToolbox />')) {
  source = source.replace(
    '          {analysis ? <Results analysis={analysis} /> : <EmptyState />}\n        </div>',
    '          {analysis ? <Results analysis={analysis} /> : <EmptyState />}\n          <DigitalToolbox />\n        </div>'
  );
}

fs.writeFileSync(path, source);
console.log('Digital Toolbox wired into app/page.tsx');
