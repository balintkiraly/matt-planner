import { useRaceState } from "./hooks/useRaceState";
import { useHowToDismissed } from "./hooks/useHowToDismissed";
import { AppHeader } from "./components/AppHeader";
import { ScoreSummary } from "./components/ScoreSummary";
import { AreaSelectionPanel } from "./components/AreaSelectionPanel";
import { ColorLegend } from "./components/ColorLegend";
import { PointsSection } from "./components/PointsSection";
import { BonusSection } from "./components/BonusSection";
import { MapPane } from "./components/MapPane";

export default function App() {
  const race = useRaceState();
  const [showHowTo, setShowHowTo] = useHowToDismissed();

  const completedBonusIds = new Set(
    race.score.completedBonuses.map((c) => c.id)
  );

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-50 overflow-hidden">
      <div className="grid h-full grid-cols-1 md:grid-cols-[420px_minmax(0,1fr)]">
        {/* Left pane */}
        <div className="flex flex-col border-b border-slate-800 md:border-b-0 md:border-r bg-slate-900/80 backdrop-blur">
          <AppHeader
            isHikeMode={race.isHikeMode}
            onSetHikeMode={race.setIsHikeMode}
          />
          <ScoreSummary
            score={race.score}
            pointsCount={race.points.length}
            bonusCombosCount={race.bonusCombinations.length}
          />
          <section className="overflow-y-auto max-h-[calc(100vh-150px)]">
            {race.selectionBounds && race.areaScore && (
              <AreaSelectionPanel
                areaScore={race.areaScore}
                onClear={race.clearSelection}
              />
            )}
            {!race.isHikeMode && race.points.length > 0 && (
              <ColorLegend
                minScore={race.minScore}
                maxScore={race.maxScore}
              />
            )}
            <PointsSection
              isHikeMode={race.isHikeMode}
              points={race.points}
              pointForm={race.pointForm}
              setPointForm={race.setPointForm}
              editingPointId={race.editingPointId}
              visitedPointIds={race.visitedPointIds}
              combosByPointId={race.combosByPointId}
              onResetPointForm={race.resetPointForm}
              onUpsertPoint={race.upsertPoint}
              onEditPoint={race.editPoint}
              onDeletePoint={race.deletePoint}
              onToggleVisited={race.toggleVisited}
            />
            <BonusSection
              isHikeMode={race.isHikeMode}
              points={race.points}
              bonusCombinations={race.bonusCombinations}
              bonusForm={race.bonusForm}
              setBonusForm={race.setBonusForm}
              editingBonusId={race.editingBonusId}
              completedBonusIds={completedBonusIds}
              onResetBonusForm={race.resetBonusForm}
              onUpsertBonus={race.upsertBonus}
              onEditBonus={race.editBonus}
              onDeleteBonus={race.deleteBonus}
            />
          </section>
        </div>

        {/* Right pane: map */}
        <MapPane
          isHikeMode={race.isHikeMode}
          points={race.points}
          visitedPointIds={race.visitedPointIds}
          combosByPointId={race.combosByPointId}
          minScore={race.minScore}
          maxScore={race.maxScore}
          selectionBounds={race.selectionBounds}
          isSelectingArea={race.isSelectingArea}
          onMapClick={race.handleMapClick}
          onAreaSelected={race.handleAreaSelected}
          onSelectingAreaChange={race.setIsSelectingArea}
          onToggleVisited={race.toggleVisited}
          showHowTo={showHowTo}
          onDismissHowTo={() => setShowHowTo(false)}
        />
      </div>
    </div>
  );
}
