package org.dolui.host5.neutralprobe;

import android.database.Cursor;
import android.database.MatrixCursor;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract.Document;
import android.provider.DocumentsContract.Root;
import android.provider.DocumentsProvider;
import java.io.File;
import java.io.FileNotFoundException;

/** Single read-only fixture for DocumentsUI; no user directories and no bundled font. */
public final class ProbeFontDocuments extends DocumentsProvider {
 private static final File FONT = new File("/system/fonts/DroidSansMono.ttf");
 private static final String TITLE = "SoftWet TTF QA";
 private static final String[] ROOT_COLS = {Root.COLUMN_ROOT_ID, Root.COLUMN_DOCUMENT_ID,
  Root.COLUMN_TITLE, Root.COLUMN_ICON, Root.COLUMN_FLAGS, Root.COLUMN_MIME_TYPES};
 private static final String[] DOC_COLS = {Document.COLUMN_DOCUMENT_ID, Document.COLUMN_DISPLAY_NAME,
  Document.COLUMN_MIME_TYPE, Document.COLUMN_FLAGS, Document.COLUMN_SIZE};
 @Override public boolean onCreate() { return true; }
 @Override public Cursor queryRoots(String[] columns) {
  MatrixCursor c = new MatrixCursor(columns == null ? ROOT_COLS : columns);
  if (FONT.canRead()) c.newRow().add(Root.COLUMN_ROOT_ID,"root").add(Root.COLUMN_DOCUMENT_ID,"root")
   .add(Root.COLUMN_TITLE,TITLE).add(Root.COLUMN_ICON,android.R.drawable.ic_menu_agenda)
   .add(Root.COLUMN_FLAGS,Root.FLAG_LOCAL_ONLY).add(Root.COLUMN_MIME_TYPES,"font/ttf");
  return c;
 }
 @Override public Cursor queryDocument(String id,String[] columns) throws FileNotFoundException {
  boolean root = "root".equals(id);
  if (!root && (!"mono".equals(id) || !FONT.canRead())) throw new FileNotFoundException();
  MatrixCursor c = new MatrixCursor(columns == null ? DOC_COLS : columns);
  c.newRow().add(Document.COLUMN_DOCUMENT_ID,id).add(Document.COLUMN_DISPLAY_NAME,root ? TITLE : FONT.getName())
   .add(Document.COLUMN_MIME_TYPE,root ? Document.MIME_TYPE_DIR : "font/ttf")
   .add(Document.COLUMN_FLAGS,0).add(Document.COLUMN_SIZE,root ? null : FONT.length());
  return c;
 }
 @Override public Cursor queryChildDocuments(String parent,String[] columns,String sort) throws FileNotFoundException {
  if (!"root".equals(parent)) throw new FileNotFoundException();
  return queryDocument("mono",columns);
 }
 @Override public ParcelFileDescriptor openDocument(String id,String mode,CancellationSignal cancel) throws FileNotFoundException {
  if (!"mono".equals(id) || !"r".equals(mode)) throw new FileNotFoundException();
  return ParcelFileDescriptor.open(FONT,ParcelFileDescriptor.MODE_READ_ONLY);
 }
}
