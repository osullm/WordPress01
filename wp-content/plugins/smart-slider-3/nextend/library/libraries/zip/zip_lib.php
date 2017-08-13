<?php
/* vim: set expandtab sw=4 ts=4 sts=4: */
/**
 * Zip file creation
 *
 * @package PhpMyAdmin
 */

/**
 * Zip file creation class.
 * Makes zip files.
 *
 * @access  public
 * @package PhpMyAdmin
 * @see     Official ZIP file format: http://www.pkware.com/support/zip-app-note
 */
class N2ZipFile
{

    /**
     * Whether to echo zip as it's built or return as string from -> file
     *
     * @var  boolean $doWrite
     */
    var $doWrite = false;

    /**
     * Array to store compressed data
     *
     * @var  array $datasec
     */
    var $datasec = array();

    /**
     * Central directory
     *
     * @var  array $ctrl_dir
     */
    var $ctrl_dir = array();

    /**
     * End of central directory record
     *
     * @var  string $eof_ctrl_dir
     */
    var $eof_ctrl_dir = "\x50\x4b\x05\x06\x00\x00\x00\x00";

    /**
     * Last offset position
     *
     * @var  integer $old_offset
     */
    var $old_offset = 0;


    /**
     * Sets member variable this -> doWrite to true
     * - Should be called immediately after class instantiantion
     * - If set to true, then ZIP archive are echo'ed to STDOUT as each
     *   file is added via this -> addfile(), and central directories are
     *   echoed to STDOUT on final call to this -> file().  Also,
     *   this -> file() returns an empty string so it is safe to issue a
     *   "echo $zipfile;" command
     *
     * @access public
     *
     * @return void
     */
    function setDoWrite() {
        $this->doWrite = true;
    } // end of the 'setDoWrite()' method

    /**
     * Converts an Unix timestamp to a four byte DOS date and time format (date
     * in high two bytes, time in low two bytes allowing magnitude comparison).
     *
     * @param integer $unixtime the current Unix timestamp
     *
     * @return integer the current date in a four byte DOS format
     *
     * @access private
     */
    function unix2DosTime($unixtime = 0) {
        $timearray = ($unixtime == 0) ? getdate() : getdate($unixtime);

        if ($timearray['year'] < 1980) {
            $timearray['year']    = 1980;
            $timearray['mon']     = 1;
            $timearray['mday']    = 1;
            $timearray['hours']   = 0;
            $timearray['minutes'] = 0;
            $timearray['seconds'] = 0;
        } // end if

        return (($timearray['year'] - 1980) << 25) | ($timearray['mon'] << 21) | ($timearray['mday'] << 16) | ($timearray['hours'] << 11) | ($timearray['minutes'] << 5) | ($timearray['seconds'] >> 1);
    } // end of the 'unix2DosTime()' method


    /**
     * Adds "file" to archive
     *
     * @param string  $data file contents
     * @param string  $name name of the file in the archive (may contains the path)
     * @param integer $time the current timestamp
     *
     * @access public
     *
     * @return void
     */
    function addFile($data, $name, $time = 0) {
        $name = str_replace('\\', '/', $name);

        $hexdtime = pack('V', $this->unix2DosTime($time));

        $fr = "\x50\x4b\x03\x04";
        $fr .= "\x14\x00"; // ver needed to extract
        $fr .= "\x00\x00"; // gen purpose bit flag
        $fr .= "\x08\x00"; // compression method
        $fr .= $hexdtime; // last mod time and date

        // "local file header" segment
        $unc_len = strlen($data);
        $crc     = crc32($data);
        $zdata   = gzcompress($data);
        $zdata   = substr(substr($zdata, 0, strlen($zdata) - 4), 2); // fix crc bug
        $c_len   = strlen($zdata);
        $fr .= pack('V', $crc); // crc32
        $fr .= pack('V', $c_len); // compressed filesize
        $fr .= pack('V', $unc_len); // uncompressed filesize
        $fr .= pack('v', strlen($name)); // length of filename
        $fr .= pack('v', 0); // extra field length
        $fr .= $name;

        // "file data" segment
        $fr .= $zdata;

        // echo this entry on the fly, ...
        if ($this->doWrite) {
            echo $fr;
        } else { // ... OR add this entry to array
            $this->datasec[] = $fr;
        }

        // now add to central directory record
        $cdrec = "\x50\x4b\x01\x02";
        $cdrec .= "\x00\x00"; // version made by
        $cdrec .= "\x14\x00"; // version needed to extract
        $cdrec .= "\x00\x00"; // gen purpose bit flag
        $cdrec .= "\x08\x00"; // compression method
        $cdrec .= $hexdtime; // last mod time & date
        $cdrec .= pack('V', $crc); // crc32
        $cdrec .= pack('V', $c_len); // compressed filesize
        $cdrec .= pack('V', $unc_len); // uncompressed filesize
        $cdrec .= pack('v', strlen($name)); // length of filename
        $cdrec .= pack('v', 0); // extra field length
        $cdrec .= pack('v', 0); // file comment length
        $cdrec .= pack('v', 0); // disk number start
        $cdrec .= pack('v', 0); // internal file attributes
        $cdrec .= pack('V', 32); // external file attributes
        // - 'archive' bit set

        $cdrec .= pack('V', $this->old_offset); // relative offset of local header
        $this->old_offset += strlen($fr);

        $cdrec .= $name;

        // optional extra field, file comment goes here
        // save to central directory
        $this->ctrl_dir[] = $cdrec;
    } // end of the 'addFile()' method


    /**
     * Echo central dir if ->doWrite==true, else build string to return
     *
     * @return string  if ->doWrite {empty string} else the ZIP file contents
     *
     * @access public
     */
    function file() {
        $ctrldir = implode('', $this->ctrl_dir);
        $header  = $ctrldir . $this->eof_ctrl_dir . pack('v', sizeof($this->ctrl_dir)) . //total #of entries "on this disk"
            pack('v', sizeof($this->ctrl_dir)) . //total #of entries overall
            pack('V', strlen($ctrldir)) . //size of central dir
            pack('V', $this->old_offset) . //offset to start of central dir
            "\x00\x00"; //.zip file comment length

        if ($this->doWrite) { // Send central directory & end ctrl dir to STDOUT
            echo $header;
            return ""; // Return empty string
        } else { // Return entire ZIP archive as string
            $data = implode('', $this->datasec);
            return $data . $header;
        }
    } // end of the 'file()' method

} // end of the 'ZipFile' class


/**
 * Gets zip file contents
 *
 * @param string $file           zip file
 * @param string $specific_entry regular expression to match a file
 *
 * @return array ($error_message, $file_data); $error_message
 *                  is empty if no error
 */
function N2_PMA_getZipContents($file, $specific_entry = null)
{
    $error_message = '';
    $file_data = '';
    $zip_handle = zip_open($file);
    if (!is_resource($zip_handle)) {
        $error_message = __('Error in ZIP archive:')
            . ' ' . N2_PMA_getZipError($zip_handle);
        return (array('error' => $error_message, 'data' => $file_data));
    }
    $first_zip_entry = zip_read($zip_handle);
    if (false === $first_zip_entry) {
        $error_message = __('No files found inside ZIP archive!');
        zip_close($zip_handle);
        return (array('error' => $error_message, 'data' => $file_data));
    }
    /* Is the the zip really an ODS file? */
    $read = zip_entry_read($first_zip_entry);
    $ods_mime = 'application/vnd.oasis.opendocument.spreadsheet';
    if (!strcmp($ods_mime, $read)) {
        $specific_entry = '/^content\.xml$/';
    }
    if (!isset($specific_entry)) {
        zip_entry_open($zip_handle, $first_zip_entry, 'r');
        /* File pointer has already been moved,
         * so include what was read above */
        $file_data = $read;
        $file_data .= zip_entry_read(
            $first_zip_entry,
            zip_entry_filesize($first_zip_entry)
        );
        zip_entry_close($first_zip_entry);
        zip_close($zip_handle);
        return (array('error' => $error_message, 'data' => $file_data));
    }
    /* Return the correct contents, not just the first entry */
    for ( ; ; ) {
        $entry = zip_read($zip_handle);
        if (is_resource($entry)) {
            if (preg_match($specific_entry, zip_entry_name($entry))) {
                zip_entry_open($zip_handle, $entry, 'r');
                $file_data = zip_entry_read(
                    $entry,
                    zip_entry_filesize($entry)
                );
                zip_entry_close($entry);
                break;
            }
        } else {
            /**
             * Either we have reached the end of the zip and still
             * haven't found $specific_entry or there was a parsing
             * error that we must display
             */
            if ($entry === false) {
                $error_message = __('Error in ZIP archive:')
                    . ' Could not find "' . $specific_entry . '"';
            } else {
                $error_message = __('Error in ZIP archive:')
                    . ' ' . N2_PMA_getZipError($zip_handle);
            }
            break;
        }
    }
    zip_close($zip_handle);
    return (array('error' => $error_message, 'data' => $file_data));
}
/**
 * Returns the file name of the first file that matches the given $file_regexp.
 *
 * @param string $file_regexp regular expression for the file name to match
 * @param string $file        zip archive
 *
 * @return string the file name of the first file that matches the given regexp
 */
function N2_PMA_findFileFromZipArchive($file_regexp, $file)
{
    $zip_handle = zip_open($file);
    if (is_resource($zip_handle)) {
        $entry = zip_read($zip_handle);
        while (is_resource($entry)) {
            if (preg_match($file_regexp, zip_entry_name($entry))) {
                $file_name = zip_entry_name($entry);
                zip_close($zip_handle);
                return $file_name;
            }
            $entry = zip_read($zip_handle);
        }
    }
    zip_close($zip_handle);
    return false;
}
/**
 * Returns the number of files in the zip archive.
 *
 * @param string $file zip archive
 *
 * @return int the number of files in the zip archive
 */
function N2_PMA_getNoOfFilesInZip($file)
{
    $count = 0;
    $zip_handle = zip_open($file);
    if (is_resource($zip_handle)) {
        $entry = zip_read($zip_handle);
        while (is_resource($entry)) {
            $count++;
            $entry = zip_read($zip_handle);
        }
        zip_close($zip_handle);
    }
    return $count;
}
/**
 * Extracts a set of files from the given zip archive to a given destinations.
 *
 * @param string $zip_path path to the zip archive
 * @param string $entry    file in the archive that should be extracted
 *
 * @return string|bool data on sucess, false otherwise
 */
function N2_PMA_zipExtract($zip_path, $entry)
{
    $zip = new ZipArchive;
    if ($zip->open($zip_path) === true) {
        $result = $zip->getFromName($entry);
        $zip->close();
        return $result;
    }
    return false;
}
/**
 * Gets zip error message
 *
 * @param resource $code error code
 *
 * @return string error message
 */
function N2_PMA_getZipError($code)
{
    // I don't think this needs translation
    switch ($code) {
        case ZIPARCHIVE::ER_MULTIDISK:
            $message = 'Multi-disk zip archives not supported';
            break;
        case ZIPARCHIVE::ER_READ:
            $message = 'Read error';
            break;
        case ZIPARCHIVE::ER_CRC:
            $message = 'CRC error';
            break;
        case ZIPARCHIVE::ER_NOZIP:
            $message = 'Not a zip archive';
            break;
        case ZIPARCHIVE::ER_INCONS:
            $message = 'Zip archive inconsistent';
            break;
        default:
            $message = $code;
    }
    return $message;
}