/**************************************
 * 공통 JSON 응답 헬퍼
 **************************************/
function json(output) {
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**************************************
 * POST 요청 처리
 **************************************/
function doPost(e) {
  try {
    if (!e || !e.parameter || !e.parameter.action) {
      return json({
        success: false,
        message: 'No action provided'
      });
    }

    const action = e.parameter.action;

    if (action === 'addVisitor') {
      if (!e.parameter.data) {
        return json({
          success: false,
          message: 'No visitor data provided'
        });
      }

      const visitor = JSON.parse(e.parameter.data);
      return addVisitor(visitor);
    }

    if (action === 'getVisitors') {
      return getVisitors();
    }

    if (action === 'getStatistics') {
      return getStatistics();
    }

    return json({
      success: false,
      message: 'Invalid action: ' + action
    });

  } catch (err) {
    return json({
      success: false,
      message: err.toString()
    });
  }
}

/**************************************
 * 방문자 추가
 **************************************/
function addVisitor(v) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = '방문자목록';
    let sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow([
        '등록일시',
        '방문월',
        '방문일',
        '방문시간',
        '방문목적',
        '이름',
        '성별',
        '출생년도',
        '거주지(시군)',
        '거주지(읍면동)',
        '연락처',
        '비고'
      ]);
    }

    sheet.appendRow([
      new Date(),
      v.visitMonth + '월',
      v.visitDay + '일',
      v.visitTime || '',
      v.visitPurpose || '',
      v.name || '',
      v.gender || '',
      v.birthYear || '',
      v.residence || '',
      v.residenceDetail || '',
      v.phone || '',
      v.memo || ''
    ]);

    return json({
      success: true,
      message: '방문자 등록이 완료되었습니다.'
    });

  } catch (err) {
    return json({
      success: false,
      message: err.toString()
    });
  }
}

/**************************************
 * 방문자 목록 조회
 **************************************/
function getVisitors() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('방문자목록');

    if (!sheet || sheet.getLastRow() <= 1) {
      return json({
        success: true,
        visitors: []
      });
    }

    const values = sheet.getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn()
    ).getValues();

    const visitors = values.map(row => ({
      timestamp: row[0],
      visitMonth: row[1],
      visitDay: row[2],
      visitTime: row[3],
      visitPurpose: row[4],
      name: row[5],
      gender: row[6],
      birthYear: row[7],
      residence: row[8],
      residenceDetail: row[9],
      phone: row[10],
      memo: row[11]
    }));

    return json({
      success: true,
      visitors
    });

  } catch (err) {
    return json({
      success: false,
      message: err.toString(),
      visitors: []
    });
  }
}

/**************************************
 * 통계 조회
 **************************************/
function getStatistics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('방문자목록');

    if (!sheet || sheet.getLastRow() <= 1) {
      return json({
        success: true,
        statistics: {
          totalVisitors: 0,
          byMonth: {},
          byGender: {},
          byResidence: {},
          byPurpose: {}
        }
      });
    }

    const values = sheet.getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn()
    ).getValues();

    const stats = {
      totalVisitors: values.length,
      byMonth: {},
      byGender: {},
      byResidence: {},
      byPurpose: {}
    };

    values.forEach(row => {
      const month = row[1];
      const purpose = row[4];
      const gender = row[6];
      const residence = row[8];

      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;
      stats.byPurpose[purpose] = (stats.byPurpose[purpose] || 0) + 1;
      stats.byGender[gender] = (stats.byGender[gender] || 0) + 1;
      stats.byResidence[residence] = (stats.byResidence[residence] || 0) + 1;
    });

    return json({
      success: true,
      statistics: stats
    });

  } catch (err) {
    return json({
      success: false,
      message: err.toString()
    });
  }
}

/**************************************
 * GET 요청 처리 (확인용)
 **************************************/
/**************************************
 * GET 요청 처리
 **************************************/
function doGet(e) {
  try {
    // URL 파라미터가 있는 경우 처리
    if (e && e.parameter && e.parameter.action) {
      const action = e.parameter.action;

      if (action === 'getVisitors') {
        return getVisitors();
      }

      if (action === 'getStatistics') {
        return getStatistics();
      }

      return json({
        success: false,
        message: 'Invalid action: ' + action
      });
    }

    // 파라미터가 없으면 기본 확인 페이지 반환
    const html = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>랩 방문자 관리 시스템</title>
      </head>
      <body>
        <h1>랩 방문자 관리 시스템 API</h1>
        <p>✓ API가 정상 작동 중입니다.</p>
      </body>
      </html>
    `);
    return html;

  } catch (err) {
    return json({
      success: false,
      message: err.toString()
    });
  }
}