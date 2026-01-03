import { Injectable } from '@nestjs/common';
import { AlgType } from '../types/enums';

export interface ParsedAlgorithm {
  originalMoves: string;
  normalizedMoves: string;
  moveCount: number;
  algType: AlgType;
  caseName?: string;
}

/**
 * Algorithm Parser Service
 *
 * Handles parsing, normalization, and classification of speedcubing algorithms
 */
@Injectable()
export class AlgorithmParserService {
  /**
   * Parse a text block containing multiple algorithms
   */
  parseAlgorithmsText(text: string): ParsedAlgorithm[] {
    const algorithms: ParsedAlgorithm[] = [];

    // Split by lines and filter out empty lines
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 && !line.startsWith('#') && !line.startsWith('//'),
      );

    for (const line of lines) {
      const parsed = this.parseAlgorithmLine(line);
      if (parsed) {
        algorithms.push(parsed);
      }
    }

    return algorithms;
  }

  /**
   * Parse a single algorithm line
   * Supports formats like:
   * - "R U R' U'"
   * - "T-Perm: R U R' F' R U R' U' R' F R2 U' R'"
   * - "F2L #1: R U' R'"
   */
  private parseAlgorithmLine(line: string): ParsedAlgorithm | null {
    // Try to extract case name and moves
    let caseName: string | undefined;
    let movesText: string;

    // Check if line has a case name (contains colon)
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      caseName = line.substring(0, colonIndex).trim();
      movesText = line.substring(colonIndex + 1).trim();
    } else {
      movesText = line.trim();
    }

    // Validate that we have actual moves
    if (!this.containsMoves(movesText)) {
      return null;
    }

    const normalizedMoves = this.normalizeMoves(movesText);
    const moveCount = this.countMoves(normalizedMoves);
    const algType = this.classifyAlgorithm(caseName);

    return {
      originalMoves: movesText,
      normalizedMoves,
      moveCount,
      algType,
      caseName,
    };
  }

  /**
   * Check if text contains actual cube moves
   */
  private containsMoves(text: string): boolean {
    // Basic check for cube notation
    const movePattern = /[RLUDFBMES][w]?[2']?/;
    return movePattern.test(text);
  }

  /**
   * Normalize algorithm moves to standard format
   */
  private normalizeMoves(moves: string): string {
    return (
      moves
        // Remove extra whitespace
        .replace(/\s+/g, ' ')
        .trim()
        // Normalize wide moves to 'w' notation
        .replace(/([RLUDFB])w/g, '$1w')
        // Normalize double moves
        .replace(/([RLUDFBMES][w]?)2/g, '$12')
        // Normalize prime moves
        .replace(/([RLUDFBMES][w]?)'/g, "$1'")
        // Remove rotation moves for now (x, y, z)
        .replace(/[xyz][2']?\s*/g, '')
        .trim()
    );
  }

  /**
   * Count the number of moves in a normalized algorithm
   */
  private countMoves(normalizedMoves: string): number {
    if (!normalizedMoves) return 0;

    // Split by spaces and count non-empty parts
    return normalizedMoves.split(/\s+/).filter((move) => move.length > 0)
      .length;
  }

  /**
   * Classify algorithm type based on case name and moves
   */
  private classifyAlgorithm(caseName?: string): AlgType {
    if (!caseName) return AlgType.OTHER;

    const name = caseName.toLowerCase();

    // F2L patterns
    if (name.includes('f2l') || name.includes('first two layers')) {
      return AlgType.F2L;
    }

    // COLL patterns (check before OLL since COLL contains 'oll')
    if (name.includes('coll')) {
      return AlgType.COLL;
    }

    // OLL patterns
    if (name.includes('oll') || name.includes('orientation')) {
      return AlgType.OLL;
    }

    // PLL patterns
    if (
      name.includes('pll') ||
      name.includes('permutation') ||
      name.includes('perm') ||
      name.includes('t-perm') ||
      name.includes('a-perm') ||
      name.includes('u-perm')
    ) {
      return AlgType.PLL;
    }

    // CMLL patterns
    if (name.includes('cmll') || name.includes('corners')) {
      return AlgType.CMLL;
    }

    // LSE patterns
    if (name.includes('lse') || name.includes('last six edges')) {
      return AlgType.LSE;
    }

    // ZBLL patterns
    if (name.includes('zbll')) {
      return AlgType.ZBLL;
    }

    return AlgType.OTHER;
  }

  /**
   * Extract all n-grams (contiguous move sequences) from an algorithm
   */
  extractNgrams(
    normalizedMoves: string,
    minLength: number = 4,
    maxLength: number = 6,
  ): string[] {
    if (!normalizedMoves) return [];

    const moves = normalizedMoves
      .split(/\s+/)
      .filter((move) => move.length > 0);
    const ngrams: string[] = [];

    // Extract n-grams of different lengths
    for (let length = minLength; length <= maxLength; length++) {
      for (let i = 0; i <= moves.length - length; i++) {
        const ngram = moves.slice(i, i + length).join(' ');
        ngrams.push(ngram);
      }
    }

    return ngrams;
  }
}
