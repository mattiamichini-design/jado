import methodIndex from '@/jado/runtime/index.json';
import r01 from '@/jado/runtime/R01.json';
import r03 from '@/jado/runtime/R03.json';
import r04 from '@/jado/runtime/R04.json';
import r05 from '@/jado/runtime/R05.json';
import r07 from '@/jado/runtime/R07.json';
import r08 from '@/jado/runtime/R08.json';
import r09 from '@/jado/runtime/R09.json';
import visualResearch from '@/jado/runtime/visual-research.json';
import { ROUTE_COPY } from './routes-data';
import { buildRoutesModel, type RoutesModel } from './routes-model';

/**
 * Build-time bridge to the method. The landing reads the runtime files and ships only the
 * derived values; the installable method never reads anything from app/ or components/.
 */
export function loadRoutesModel(): RoutesModel {
  return buildRoutesModel(
    methodIndex,
    {
      R01: r01,
      R03: r03,
      R04: r04,
      R05: r05,
      R07: r07,
      R08: r08,
      R09: r09,
      'visual-research': visualResearch,
    },
    ROUTE_COPY,
  );
}
