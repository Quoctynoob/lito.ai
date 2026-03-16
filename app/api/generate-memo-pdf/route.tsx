import { NextRequest, NextResponse } from 'next/server';
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

// 1. Upgraded Styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111827', lineHeight: 1.5 },
  header: { marginBottom: 20, borderBottom: '2pt solid #000', paddingBottom: 15 },
  companyName: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  
  // Notice: Sections are allowed to wrap now!
  section: { marginTop: 18, marginBottom: 12 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', backgroundColor: '#F3F4F6', padding: 8, marginBottom: 12, textTransform: 'uppercase' },
  subTitle: { fontSize: 11, fontWeight: 'bold', marginTop: 12, marginBottom: 8, color: '#374151' },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  label: { color: '#4B5563', width: '35%', fontWeight: 'bold' },
  value: { width: '65%' },
  
  vBlock: { marginBottom: 10 },
  vLabel: { fontWeight: 'bold', color: '#374151', marginBottom: 2 },
  vText: { color: '#111827', lineHeight: 1.5 },
  
  scoreBox: { backgroundColor: '#111827', padding: 15, borderRadius: 6, marginTop: 10, marginBottom: 10 },
  scoreText: { fontSize: 24, fontWeight: 'bold', color: '#FFF', textAlign: 'center' },
  scoreSub: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 4 },
  
  bulletItem: { flexDirection: 'row', marginBottom: 6 },
  bullet: { width: 15, fontWeight: 'bold' },
  bulletText: { flex: 1, color: '#374151' },
  alertBox: { border: '1pt solid #DC2626', padding: 10, marginTop: 5, marginBottom: 5 },
  
  claimBox: { marginBottom: 14, paddingBottom: 14, borderBottom: '1pt solid #E5E7EB' },
});

// Helper component for bullet lists
const BulletList = ({ items }: { items: any[] }) => (
  <View>
    {items && items.length > 0 ? (
      items.map((item, i) => (
        // wrap={false} keeps individual bullets from snapping in half
        <View key={i} style={styles.bulletItem} wrap={false}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{typeof item === 'string' ? item : item.name || JSON.stringify(item)}</Text>
        </View>
      ))
    ) : (
      <Text style={{ color: '#9CA3AF', fontStyle: 'italic', marginBottom: 6 }}>None reported.</Text>
    )}
  </View>
);

// 2. The PDF Layout
const VCMemoPDF = ({ memo, companyName }: { memo: any; companyName: string }) => {
  const cats = memo.categories || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header} wrap={false}>
          <Text style={styles.companyName}>{companyName}</Text>
          <Text style={styles.subtitle}>Institutional Investment Due Diligence Memo • Lito.ai</Text>
        </View>

        {/* EXEC SUMMARY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.row}><Text style={styles.label}>Stage:</Text><Text style={styles.value}>{memo.stage || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Industry:</Text><Text style={styles.value}>{memo.industry || 'N/A'}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Raising:</Text><Text style={styles.value}>{memo.raising || 'N/A'}</Text></View>
          <View style={styles.row}>
            <Text style={styles.label}>Founders:</Text>
            <Text style={styles.value}>
              {Array.isArray(memo.founders) 
                ? memo.founders.map((f: any) => typeof f === 'object' ? f.name : f).join(', ') 
                : typeof memo.founders === 'string' ? memo.founders : 'N/A'}
            </Text>
          </View>
          <View style={styles.vBlock}>
            <Text style={styles.vLabel}>One-Liner:</Text>
            <Text style={styles.vText}>{memo.one_liner || 'N/A'}</Text>
          </View>
        </View>

        {/* SECTION 1: VERDICT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 1: The Verdict</Text>
          <View style={styles.scoreBox} wrap={false}>
            <Text style={styles.scoreText}>{memo.verdict?.score || 0} / 100</Text>
            <Text style={styles.scoreSub}>Tier: {memo.verdict?.tier} | Recommendation: {memo.verdict?.recommendation}</Text>
          </View>
          
          {memo.verdict?.gatekeeper_alert?.triggered && (
            <View style={styles.alertBox} wrap={false}>
              <Text style={{ fontWeight: 'bold', color: '#DC2626' }}>GATEKEEPER ALERT:</Text>
              <Text style={{ marginTop: 4 }}>{memo.verdict.gatekeeper_alert.message}</Text>
            </View>
          )}

          {memo.verdict?.top_deal_killers?.length > 0 && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ ...styles.subTitle, color: '#DC2626' }}>Top Deal Killers</Text>
              {memo.verdict.top_deal_killers.map((killer: any, i: number) => (
                <View key={i} style={styles.bulletItem} wrap={false}>
                  <Text style={{...styles.bullet, color: '#DC2626'}}>✗</Text>
                  <Text style={styles.bulletText}><Text style={{fontWeight: 'bold'}}>{killer.title}:</Text> {killer.evidence}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* SECTION 2: SCORE BREAKDOWN */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Section 2: Score Breakdown</Text>
          {[
            { name: 'Team & Equity', data: cats.team_equity },
            { name: 'Traction & Validation', data: cats.traction_validation },
            { name: 'Market & Vertical', data: cats.market_vertical },
            { name: 'Capital Efficiency', data: cats.capital_efficiency },
            { name: 'Cap Table & Terms', data: cats.cap_table_terms },
          ].map((cat, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{cat.name}</Text>
              <Text style={styles.value}>{cat.data?.score || 0} / {cat.data?.max || 0}</Text>
            </View>
          ))}
          <View style={{ ...styles.row, marginTop: 6, borderTop: '1pt solid #E5E7EB', paddingTop: 10 }}>
            <Text style={styles.label}>Weighted Subtotal</Text>
            <Text style={styles.value}>{memo.score_breakdown?.weighted_subtotal || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Penalties</Text>
            <Text style={{...styles.value, color: '#DC2626'}}>-{memo.penalties?.total || memo.score_breakdown?.penalties || 0}</Text>
          </View>
          <View style={styles.row}>
            <Text style={{...styles.label, color: '#000'}}>Final Score</Text>
            <Text style={{...styles.value, color: '#000'}}>{memo.score_breakdown?.final_tfi_score || memo.verdict?.score || 0} / 100</Text>
          </View>
        </View>

        {/* SECTION 3: CONSOLIDATED SUMMARY */}
        {memo.verified_strengths?.items?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section 3: Consolidated Summary</Text>
            <BulletList items={memo.verified_strengths.items} />
            {memo.verified_strengths.however_note && (
              <View style={{ backgroundColor: '#F9FAFB', padding: 12, marginTop: 10, borderRadius: 4 }} wrap={false}>
                <Text style={{ fontStyle: 'italic', color: '#374151' }}><Text style={{fontWeight: 'bold'}}>However: </Text>{memo.verified_strengths.however_note}</Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 4: TEAM & EQUITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 4: Team & Equity</Text>
          <Text style={styles.subTitle}>Founder-Market Fit</Text>
          <BulletList items={cats.team_equity?.founder_market_fit || []} />
          <Text style={styles.subTitle}>Concerns</Text>
          <BulletList items={cats.team_equity?.concerns || []} />
          <Text style={styles.subTitle}>Red Flags</Text>
          <BulletList items={cats.team_equity?.red_flags || []} />
        </View>

        {/* SECTION 5: TRACTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 5: Traction & Validation</Text>
          <Text style={styles.subTitle}>Claimed in Deck</Text>
          <BulletList items={cats.traction_validation?.claimed_in_deck || []} />
          <Text style={styles.subTitle}>Verified Findings</Text>
          <BulletList items={cats.traction_validation?.verified_findings || []} />
        </View>

        {/* SECTION 6: MARKET */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 6: Market & Vertical</Text>
          <Text style={styles.subTitle}>Business Model Snapshot</Text>
          
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Problem:</Text>
            <Text style={styles.vText}>{cats.market_vertical?.business_model_snapshot?.problem || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Solution:</Text>
            <Text style={styles.vText}>{cats.market_vertical?.business_model_snapshot?.solution || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Revenue Model:</Text>
            <Text style={styles.vText}>{cats.market_vertical?.business_model_snapshot?.revenue_model || 'N/A'}</Text>
          </View>
          
          <Text style={styles.subTitle}>Total Addressable Market (TAM)</Text>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Claimed TAM:</Text>
            <Text style={styles.vText}>{cats.market_vertical?.tam?.claimed || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Verified TAM:</Text>
            <Text style={styles.vText}>{cats.market_vertical?.tam?.verified || 'N/A'}</Text>
          </View>
        </View>

        {/* SECTION 7: CAPITAL EFFICIENCY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 7: Capital Efficiency</Text>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Use of Funds:</Text>
            <Text style={styles.vText}>{cats.capital_efficiency?.funding_plan?.use_of_funds || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Burn Rate:</Text>
            <Text style={styles.vText}>{cats.capital_efficiency?.funding_plan?.burn_rate || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Runway:</Text>
            <Text style={styles.vText}>{cats.capital_efficiency?.funding_plan?.runway || 'N/A'}</Text>
          </View>
        </View>

        {/* SECTION 8: CAP TABLE & TERMS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 8: Cap Table & Terms</Text>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Raise Amount:</Text>
            <Text style={styles.vText}>{cats.cap_table_terms?.funding_terms?.raise_amount || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Valuation Cap:</Text>
            <Text style={styles.vText}>{cats.cap_table_terms?.funding_terms?.valuation_cap || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Instrument:</Text>
            <Text style={styles.vText}>{cats.cap_table_terms?.funding_terms?.instrument || 'N/A'}</Text>
          </View>
          <View style={styles.vBlock} wrap={false}>
            <Text style={styles.vLabel}>Dilution:</Text>
            <Text style={styles.vText}>{cats.cap_table_terms?.funding_terms?.dilution || 'N/A'}</Text>
          </View>
        </View>

        {/* SECTION 9: CLAIM VERIFICATIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 9: Claim Verifications</Text>
          <View style={{ flexDirection: 'row', gap: 30, marginBottom: 20, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 4 }} wrap={false}>
             <Text><Text style={{fontWeight: 'bold'}}>Verified:</Text> {memo.claim_verifications?.verified_count || 0}</Text>
             <Text><Text style={{fontWeight: 'bold'}}>Unverified:</Text> {memo.claim_verifications?.unverified_count || 0}</Text>
             <Text><Text style={{fontWeight: 'bold'}}>Disputed:</Text> {memo.claim_verifications?.disputed_count || 0}</Text>
          </View>
          
          {memo.claim_verifications?.claims?.map((claim: any, i: number) => (
             // Notice wrap={false} is here on the INDIVIDUAL claim box!
             <View key={i} style={styles.claimBox} wrap={false}>
               <Text style={{fontWeight: 'bold', marginBottom: 8, lineHeight: 1.6, color: claim.verdict === 'VERIFIED' ? '#16A34A' : claim.verdict === 'DISPUTED' ? '#DC2626' : '#6B7280'}}>
                 {claim.verdict}: {claim.claimed_in_deck}
               </Text>
               <Text style={{color: '#4B5563', marginTop: 6, lineHeight: 1.6}}>
                 {claim.verified_via_search || claim.vs_benchmark || 'No benchmark context provided.'}
               </Text>
             </View>
          ))}
        </View>

        {/* SECTION 10: UNVERIFIED CLAIMS */}
        {memo.unverified_claims?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section 10: Unverified Claims</Text>
            {memo.unverified_claims.map((claim: any, i: number) => (
               <View key={i} style={styles.claimBox} wrap={false}>
                 <Text style={{fontWeight: 'bold', marginBottom: 6, lineHeight: 1.6}}>{claim.claim}</Text>
                 <Text style={{color: '#4B5563', lineHeight: 1.6}}>Reason: {claim.reason_unverified}</Text>
               </View>
            ))}
            {memo.unverified_why_it_matters && (
              <View style={{ backgroundColor: '#F9FAFB', padding: 12, marginTop: 12 }} wrap={false}>
                <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Why It Matters</Text>
                <Text style={{ lineHeight: 1.6 }}>{memo.unverified_why_it_matters}</Text>
              </View>
            )}
          </View>
        )}

        {/* SECTION 11: PENALTIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Section 11: Penalties</Text>
          <View style={styles.row} wrap={false}>
            <Text style={styles.label}>Total Penalties:</Text>
            <Text style={{...styles.value, color: '#DC2626', fontWeight: 'bold'}}>-{memo.penalties?.total || 0}</Text>
          </View>
          <Text style={styles.subTitle}>Applied Penalties</Text>
          <BulletList items={memo.penalties?.applied || []} />
        </View>

        {/* SECTION 12: NEXT STEPS & INTERVIEW */}
        {memo.next_steps && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section 12: Next Steps</Text>
            
            {memo.next_steps.what_to_request && Object.keys(memo.next_steps.what_to_request).length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ ...styles.subTitle, fontSize: 12 }}>Documents to Request</Text>
                {Object.entries(memo.next_steps.what_to_request).map(([category, items]: [string, any], i) => (
                  items && items.length > 0 ? (
                    <View key={i} style={{ marginBottom: 12, marginLeft: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: '#4B5563', marginBottom: 6 }}>{category.replace(/_/g, ' ').toUpperCase()}</Text>
                      <BulletList items={items} />
                    </View>
                  ) : null
                ))}
              </View>
            )}

            {memo.next_steps.interview_questions && Object.keys(memo.next_steps.interview_questions).length > 0 && (
              <View>
                <Text style={{ ...styles.subTitle, fontSize: 12 }}>Interview Questions</Text>
                {Object.entries(memo.next_steps.interview_questions).map(([category, questions]: [string, any], i) => (
                  questions && questions.length > 0 ? (
                    <View key={i} style={{ marginBottom: 12, marginLeft: 10 }}>
                      <Text style={{ fontWeight: 'bold', color: '#4B5563', marginBottom: 6 }}>{category.replace(/_/g, ' ').toUpperCase()}</Text>
                      {questions.map((q: string, j: number) => (
                        <View key={j} style={styles.bulletItem} wrap={false}>
                          <Text style={styles.bullet}>Q{j + 1}:</Text>
                          <Text style={styles.bulletText}>{q}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null
                ))}
              </View>
            )}
          </View>
        )}

        {/* SECTION 13: FINAL RECOMMENDATION */}
        {memo.recommendation_rationale && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section 13: Final Recommendation</Text>
            <Text style={{ lineHeight: 1.6 }}>{memo.recommendation_rationale}</Text>
          </View>
        )}

        {/* SECTION 14: AI CONFIDENCE */}
        {memo.confidence_score && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Section 14: AI Confidence Score Breakdown</Text>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>{memo.confidence_score.score || 0}%</Text>
            {memo.confidence_score.formula_breakdown && (
              <View>
                <Text style={{ fontWeight: 'bold', marginBottom: 8, color: '#4B5563' }}>Formula Components</Text>
                {Object.entries(memo.confidence_score.formula_breakdown).map(([key, value]: [string, any], i) => (
                  <View key={i} style={{...styles.row, borderBottom: '1pt solid #E5E7EB', paddingBottom: 6, marginBottom: 6}} wrap={false}>
                    <Text style={{ color: '#111827', width: '50%' }}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={{ width: '50%', textAlign: 'right', fontWeight: 'bold', color: value < 0 ? '#DC2626' : '#16A34A' }}>
                      {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </Page>
    </Document>
  );
};

export async function POST(req: NextRequest) {
  try {
    const { memo, companyName } = await req.json();

    if (!memo || !companyName) {
      return NextResponse.json({ error: 'Missing memo data or company name.' }, { status: 400 });
    }

    const pdfBuffer = await renderToBuffer(<VCMemoPDF memo={memo} companyName={companyName} />);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${companyName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_memo.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}