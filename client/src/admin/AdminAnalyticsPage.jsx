import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { getAdminAnalytics } from "./adminService";
import { useAdminLanguage } from "./translations";

const REFRESH_MS = 10000;

const paperSx = {
  borderRadius: 3,
  backgroundColor: "rgba(255, 255, 255, 0.88)",
  border: "1px solid rgba(255, 255, 255, 0.95)",
  boxShadow: "0 8px 24px rgba(7, 20, 45, 0.05)",
  p: { xs: 2, sm: 2.5 },
};

const FUNNEL_COLORS = ["#8DD8F7", "#B8A4F5", "#F75F8A", "#D93F68"];

function formatRate(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0%";
  return `${n}%`;
}

function formatCount(value) {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : "0";
}

function sourceLabel(source, t) {
  switch (source) {
    case "whatsapp":
      return t.sourceWhatsapp;
    case "linkedin":
      return t.sourceLinkedin;
    case "copy_link":
      return t.sourceCopyLink;
    case "direct":
      return t.sourceDirect;
    default:
      return source;
  }
}

function SectionHeader({ title, hint }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: "1.15rem", sm: "1.25rem" },
          fontWeight: 700,
          color: "#07142D",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </Typography>
      {hint ? (
        <Typography sx={{ color: "#4A5568", mt: 0.5, lineHeight: 1.5, fontSize: "0.9rem" }}>
          {hint}
        </Typography>
      ) : null}
    </Box>
  );
}

function KpiCard({ label, value, emphasize }) {
  return (
    <Box
      sx={{
        ...paperSx,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        borderColor: emphasize ? "rgba(247, 95, 138, 0.28)" : paperSx.border,
        backgroundColor: emphasize
          ? "rgba(247, 95, 138, 0.06)"
          : paperSx.backgroundColor,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "#4A5568",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: "1.75rem", sm: "2rem" },
          fontWeight: 700,
          color: emphasize ? "#D93F68" : "#07142D",
          letterSpacing: "-0.03em",
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function FunnelBars({ funnel, t }) {
  if (!funnel?.length) {
    return (
      <Typography sx={{ color: "#4A5568" }}>{t.funnelEmpty}</Typography>
    );
  }

  const maxCount = Math.max(...funnel.map((s) => Number(s.count) || 0), 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75 }}>
      {funnel.map((stage, index) => {
        const count = Number(stage.count) || 0;
        const widthPct =
          maxCount > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 4 : 0) : 0;

        return (
          <Box key={stage.eventType}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                gap: 1,
                flexWrap: "wrap",
                mb: 0.75,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: "#07142D", fontSize: "0.95rem" }}>
                {stage.label || stage.eventType}
              </Typography>
              <Typography sx={{ color: "#4A5568", fontSize: "0.9rem" }}>
                {formatCount(count)} · {formatRate(stage.percentageOfViews)}{" "}
                {t.colViews.toLowerCase()}
              </Typography>
            </Box>
            <Box
              sx={{
                height: 14,
                borderRadius: 999,
                backgroundColor: "rgba(7, 20, 45, 0.06)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${widthPct}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
                  transition: "width 0.35s ease",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function SourceMatchesBars({ sources, t }) {
  const maxMatches = Math.max(
    ...sources.map((s) => Number(s.successfulMatches) || 0),
    0
  );

  if (maxMatches <= 0) {
    return null;
  }

  return (
    <Box
      role="img"
      aria-label={t.sourcesBarAria}
      sx={{ mt: 2.5, display: "flex", flexDirection: "column", gap: 1.25 }}
    >
      {sources.map((row) => {
        const matches = Number(row.successfulMatches) || 0;
        const widthPct = maxMatches > 0 ? (matches / maxMatches) * 100 : 0;
        return (
          <Box key={row.source}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 0.5,
                gap: 1,
              }}
            >
              <Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "#07142D" }}>
                {sourceLabel(row.source, t)}
              </Typography>
              <Typography sx={{ fontSize: "0.85rem", color: "#4A5568" }}>
                {formatCount(matches)}
              </Typography>
            </Box>
            <Box
              sx={{
                height: 10,
                borderRadius: 999,
                backgroundColor: "rgba(7, 20, 45, 0.06)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${widthPct}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: "#F75F8A",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function formatTrendDateLabel(dateValue) {
  const raw = String(dateValue || "");
  // API returns YYYY-MM-DD (UTC). Display as DD/MM.
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[3]}/${match[2]}`;
  }
  return raw;
}

function MatchesTrendChart({ points, t }) {
  if (!points?.length) {
    return (
      <Typography sx={{ color: "#4A5568" }}>{t.trendEmpty}</Typography>
    );
  }

  const max = Math.max(...points.map((p) => Number(p.successfulMatches) || 0), 1);
  const chartHeight = 160;
  const topPad = 28;
  const bottomPad = 44;
  const sidePad = 16;
  const barGap = 14;
  const barWidth = Math.min(48, Math.max(28, 360 / points.length));
  const width = sidePad * 2 + points.length * (barWidth + barGap) - barGap;
  const svgHeight = topPad + chartHeight + bottomPad;

  return (
    <Box sx={{ overflowX: "auto", width: "100%" }}>
      <Box
        component="svg"
        role="img"
        aria-label={t.matchesBarAria}
        viewBox={`0 0 ${width} ${svgHeight}`}
        sx={{
          width: "100%",
          minWidth: Math.max(width, Math.min(points.length * 64, 320)),
          maxWidth: 760,
          height: { xs: 220, sm: 240 },
          display: "block",
        }}
      >
        {points.map((point, index) => {
          const value = Number(point.successfulMatches) || 0;
          const h = (value / max) * chartHeight;
          const x = sidePad + index * (barWidth + barGap);
          const y = topPad + chartHeight - h;
          const centerX = x + barWidth / 2;
          return (
            <g key={`${point.date}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(h, value > 0 ? 3 : 0)}
                rx={5}
                fill="#F75F8A"
              />
              <text
                x={centerX}
                y={y - 8}
                textAnchor="middle"
                fill="#07142D"
                fontSize="14"
                fontWeight="700"
                fontFamily="Heebo, Plus Jakarta Sans, sans-serif"
              >
                {value}
              </text>
              <text
                x={centerX}
                y={topPad + chartHeight + 28}
                textAnchor="middle"
                fill="#4A5568"
                fontSize="13"
                fontWeight="600"
                fontFamily="Heebo, Plus Jakarta Sans, sans-serif"
              >
                {formatTrendDateLabel(point.date)}
              </text>
            </g>
          );
        })}
      </Box>
    </Box>
  );
}

/**
 * Admin Analytics dashboard — consumes GET /api/admin/analytics only.
 * KPI / funnel / source / trend values come from the API (no hardcoded metrics).
 */
function AdminAnalyticsPage() {
  const { language, dir, t } = useAdminLanguage();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(false);
      const data = await getAdminAnalytics();
      if (mountedRef.current) {
        setAnalytics(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(true);
        console.error(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load({ silent: false });
    const intervalId = setInterval(() => {
      load({ silent: true });
    }, REFRESH_MS);

    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [load]);

  const kpis = analytics?.kpis;
  const funnel = analytics?.funnel || [];
  const funnelConversions = analytics?.funnelConversions;
  const sources = analytics?.sources || [];
  const matchesOverTime = analytics?.matchesOverTime || [];
  const hasAnyEvents =
    (kpis?.profileViews || 0) +
      (kpis?.mentoringRequests || 0) +
      (kpis?.slotsSelected || 0) +
      (kpis?.successfulMatches || 0) >
    0;

  return (
    <Box dir={dir} lang={language}>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 0.75,
        }}
      >
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "1.75rem", sm: "2rem" },
            fontWeight: 700,
            color: "#07142D",
            letterSpacing: "-0.02em",
          }}
        >
          {t.analyticsTitle}
        </Typography>
        {refreshing && analytics ? (
          <Typography sx={{ color: "#4A5568", fontSize: "0.85rem", pt: 1 }}>
            {t.analyticsRefreshing}
          </Typography>
        ) : null}
      </Box>
      <Typography sx={{ color: "#4A5568", mb: 3, maxWidth: 640, lineHeight: 1.55 }}>
        {t.analyticsSubtitle}
      </Typography>

      {loading && !analytics && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1.5,
            py: 8,
          }}
        >
          <CircularProgress size={36} sx={{ color: "#F75F8A" }} />
          <Typography sx={{ color: "#4A5568" }}>{t.loadingAnalytics}</Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>
          {t.loadAnalyticsError}
        </Alert>
      )}

      {analytics && (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: 2,
              mb: 3,
            }}
          >
            <KpiCard
              label={t.kpiProfileViews}
              value={formatCount(kpis.profileViews)}
            />
            <KpiCard
              label={t.kpiMentoringRequests}
              value={formatCount(kpis.mentoringRequests)}
            />
            <KpiCard
              label={t.kpiSlotsSelected}
              value={formatCount(kpis.slotsSelected)}
            />
            <KpiCard
              label={t.kpiSuccessfulMatches}
              value={formatCount(kpis.successfulMatches)}
            />
            <KpiCard
              label={t.kpiConversionRate}
              value={formatRate(kpis.conversionRate)}
              emphasize
            />
          </Box>

          {!hasAnyEvents && !error && (
            <Alert severity="info" sx={{ borderRadius: 3, mb: 3 }}>
              {t.funnelEmpty}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <Box sx={paperSx}>
                <SectionHeader title={t.sectionFunnel} hint={t.sectionFunnelHint} />
                <FunnelBars funnel={funnel} t={t} />
                {funnelConversions ? (
                  <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px solid rgba(7,20,45,0.06)" }}>
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        color: "#07142D",
                        mb: 1,
                      }}
                    >
                      {t.stageConversionsTitle}
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(3, 1fr)",
                        },
                        gap: 1.25,
                      }}
                    >
                      <Typography sx={{ fontSize: "0.85rem", color: "#4A5568" }}>
                        {t.requestRateFromViews}:{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "#07142D" }}>
                          {formatRate(funnelConversions.requestRateFromViews)}
                        </Box>
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: "#4A5568" }}>
                        {t.slotRateFromRequests}:{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "#07142D" }}>
                          {formatRate(funnelConversions.slotRateFromRequests)}
                        </Box>
                      </Typography>
                      <Typography sx={{ fontSize: "0.85rem", color: "#4A5568" }}>
                        {t.matchRateFromSlots}:{" "}
                        <Box component="span" sx={{ fontWeight: 700, color: "#07142D" }}>
                          {formatRate(funnelConversions.matchRateFromSlots)}
                        </Box>
                      </Typography>
                    </Box>
                  </Box>
                ) : null}
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={paperSx}>
                <SectionHeader
                  title={t.sectionSources}
                  hint={t.sectionSourcesHint}
                />
                {sources.length === 0 ? (
                  <Typography sx={{ color: "#4A5568" }}>{t.sourcesEmpty}</Typography>
                ) : (
                  <>
                    <TableContainer sx={{ overflowX: "auto" }}>
                      <Table
                        size="small"
                        aria-label={t.sectionSources}
                        sx={{ minWidth: 420 }}
                      >
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700 }}>{t.colSource}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {t.colViews}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {t.colRequests}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {t.colMatches}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {t.colConversion}
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sources.map((row) => (
                            <TableRow key={row.source}>
                              <TableCell>{sourceLabel(row.source, t)}</TableCell>
                              <TableCell align="right">
                                {formatCount(row.profileViews)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCount(row.mentoringRequests)}
                              </TableCell>
                              <TableCell align="right">
                                {formatCount(row.successfulMatches)}
                              </TableCell>
                              <TableCell align="right">
                                {formatRate(row.conversionRate)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <SourceMatchesBars sources={sources} t={t} />
                  </>
                )}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={paperSx}>
                <SectionHeader title={t.sectionTrend} hint={t.sectionTrendHint} />
                <MatchesTrendChart points={matchesOverTime} t={t} />
              </Box>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}

export default AdminAnalyticsPage;
