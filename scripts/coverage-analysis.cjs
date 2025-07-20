#!/usr/bin/env node

/**
 * Coverage Analysis Script
 * 
 * This script analyzes the coverage report and provides insights
 * about test coverage gaps and improvement opportunities.
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_FILE = './coverage/coverage-final.json';
const THRESHOLDS = {
  global: { statements: 70, branches: 70, functions: 70, lines: 70 },
  critical: { statements: 85, branches: 85, functions: 85, lines: 85 }
};

const CRITICAL_PATHS = [
  'src/store/',
  'src/services/'
];

function analyzeCoverage() {
  if (!fs.existsSync(COVERAGE_FILE)) {
    console.error('❌ Coverage file not found. Run "npm run test:coverage" first.');
    process.exit(1);
  }

  const coverage = JSON.parse(fs.readFileSync(COVERAGE_FILE, 'utf8'));
  
  console.log('📊 Coverage Analysis Report');
  console.log('=' .repeat(50));
  
  const results = {
    total: 0,
    passing: 0,
    critical: 0,
    criticalPassing: 0,
    gaps: []
  };

  Object.entries(coverage).forEach(([filePath, data]) => {
    const relativePath = path.relative(process.cwd(), filePath);
    const isCritical = CRITICAL_PATHS.some(criticalPath => 
      relativePath.replace(/\\/g, '/').includes(criticalPath)
    );
    
    const thresholds = isCritical ? THRESHOLDS.critical : THRESHOLDS.global;
    const metrics = {
      statements: (data.s ? Object.values(data.s).filter(v => v > 0).length / Object.keys(data.s).length : 0) * 100,
      branches: (data.b ? Object.values(data.b).flat().filter(v => v > 0).length / Object.values(data.b).flat().length : 0) * 100,
      functions: (data.f ? Object.values(data.f).filter(v => v > 0).length / Object.keys(data.f).length : 0) * 100,
      lines: (data.l ? Object.values(data.l).filter(v => v > 0).length / Object.keys(data.l).length : 0) * 100
    };

    results.total++;
    if (isCritical) results.critical++;

    const passing = Object.entries(metrics).every(([key, value]) => 
      !isNaN(value) && value >= thresholds[key]
    );

    if (passing) {
      results.passing++;
      if (isCritical) results.criticalPassing++;
    } else {
      results.gaps.push({
        file: relativePath,
        isCritical,
        metrics,
        thresholds
      });
    }
  });

  // Summary
  console.log(`\n📈 Summary:`);
  console.log(`Total files: ${results.total}`);
  console.log(`Passing coverage: ${results.passing}/${results.total} (${((results.passing/results.total)*100).toFixed(1)}%)`);
  console.log(`Critical files: ${results.critical}`);
  console.log(`Critical passing: ${results.criticalPassing}/${results.critical} (${results.critical > 0 ? ((results.criticalPassing/results.critical)*100).toFixed(1) : 0}%)`);

  // Coverage gaps
  if (results.gaps.length > 0) {
    console.log(`\n⚠️  Coverage Gaps (${results.gaps.length} files):`);
    results.gaps
      .sort((a, b) => (b.isCritical ? 1 : 0) - (a.isCritical ? 1 : 0))
      .forEach(gap => {
        console.log(`\n${gap.isCritical ? '🔴 CRITICAL' : '🟡'} ${gap.file}`);
        Object.entries(gap.metrics).forEach(([metric, value]) => {
          const threshold = gap.thresholds[metric];
          const status = value >= threshold ? '✅' : '❌';
          console.log(`  ${status} ${metric}: ${value.toFixed(1)}% (threshold: ${threshold}%)`);
        });
      });
  } else {
    console.log('\n✅ All files meet coverage thresholds!');
  }

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (results.gaps.length > 0) {
    const criticalGaps = results.gaps.filter(g => g.isCritical);
    if (criticalGaps.length > 0) {
      console.log(`- Priority: Address ${criticalGaps.length} critical file(s) first`);
    }
    console.log(`- Focus on files with lowest coverage percentages`);
    console.log(`- Consider adding integration tests for complex workflows`);
  } else {
    console.log(`- Maintain current coverage levels`);
    console.log(`- Consider increasing thresholds for better quality`);
  }

  console.log(`\n🔗 View detailed report: ./coverage/index.html`);
}

if (require.main === module) {
  analyzeCoverage();
}

module.exports = { analyzeCoverage };