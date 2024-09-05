import { connect } from 'react-redux';
import { setCommand } from '../../../features/editor/EditorSlice';
import { NewEdgeModal } from '../presentations/NewEdgeModal';

const mapStateToProps = () => ({});

const mapDispatchToProps = { setCommand };

export default connect(mapStateToProps, mapDispatchToProps)(NewEdgeModal);
